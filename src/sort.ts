/**
 * Stream sorting — orders resolved streams by user preference list.
 *
 * Sort keys compose: prefs.sortOrder is a stable, multi-key sort, so
 * ["resolution", "cached", "seeders"] first groups by resolution, then by
 * cached-on-debrid status, then by seeder count. The "binge pin" pass runs
 * AFTER sorting and lifts the previous-episode's release group to the top.
 */
import type { ResolvedStream, Resolution, SortKey, SourceTag, StreamPrefs } from "./types";

const RESOLUTION_RANK: Record<Resolution, number> = {
  "2160p": 4,
  "1080p": 3,
  "720p": 2,
  "480p": 1,
  unknown: 0,
};

// Verified-cached (2) ranks above assumed-available (1, unverifiable providers
// like RD) which ranks above uncached (0).
function cacheRank(s: ResolvedStream): number {
  if (s.cachedOnDebrid) return 2;
  if (s.assumedCached) return 1;
  return 0;
}

// Higher = better quality source. null/missing sourceTag sorts below all known tiers.
const SOURCE_TAG_RANK: Record<SourceTag, number> = {
  Remux:   7,
  BluRay:  6,
  "WEB-DL": 5,
  WEBRip:  4,
  HDTV:    3,
  DVDRip:  2,
  TS:      1,
  CAM:     0,
};

type Cmp = (a: ResolvedStream, b: ResolvedStream) => number;

function cmpForKey(key: SortKey): Cmp {
  switch (key) {
    case "resolution":
      return (a, b) => RESOLUTION_RANK[b.resolution] - RESOLUTION_RANK[a.resolution];
    case "quality":
      // Remux > BluRay > WEB-DL > WEBRip > HDTV > DVDRip > TS > CAM > unknown.
      return (a, b) =>
        (SOURCE_TAG_RANK[b.sourceTag as SourceTag] ?? -1) -
        (SOURCE_TAG_RANK[a.sourceTag as SourceTag] ?? -1);
    case "cached":
      // Verified-cached first, then assumed-available (unverifiable providers
      // like RD), then uncached. 2 > 1 > 0, descending.
      return (a, b) => cacheRank(b) - cacheRank(a);
    case "seeders":
      return (a, b) => (b.seeders ?? -1) - (a.seeders ?? -1);
    case "size":
      // Default "size" is descending (bigger releases first — generally higher
      // bitrate). Use "size_desc" alias or invert manually for smallest-first.
      return (a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0);
    case "size_desc":
      return (a, b) => (a.sizeBytes ?? Number.MAX_SAFE_INTEGER) - (b.sizeBytes ?? Number.MAX_SAFE_INTEGER);
    case "name":
      return (a, b) => a.name.localeCompare(b.name);
    case "source_priority":
      // Source ID order is set by the pipeline before sort; we have no
      // priority field on the candidate, so fall back to keeping insertion
      // order (cmp returns 0).
      return () => 0;
    default:
      // Unknown key from DB (e.g. a future key or typo) — treat as no-op
      // so a stale sort_order_json doesn't crash the pipeline.
      return () => 0;
  }
}

/**
 * Stable multi-key sort using `Array.prototype.sort` (V8's sort is stable
 * since Node 12). Composes the sort comparators in order: returns the first
 * non-zero result.
 *
 * Episode-level releases rank BEFORE season packs regardless of the user's
 * sort keys. Without this, a 30 GB pack beats a 4 GB single-episode release
 * on the "size" key — the resolver picks the right file out of the pack so
 * it still plays correctly, but the stream list at the top of the player
 * misleadingly shows a season-pack filename. Surfacing the single-episode
 * candidate as the default pick keeps the UX honest.
 */
export function sortStreams(streams: ResolvedStream[], prefs: StreamPrefs): ResolvedStream[] {
  if (prefs.sortOrder.length === 0) return streams;
  const userCmps = prefs.sortOrder.map(cmpForKey);
  return [...streams].sort((a, b) => {
    const aPack = a.seasonPack ? 1 : 0;
    const bPack = b.seasonPack ? 1 : 0;
    if (aPack !== bPack) return aPack - bPack;
    for (const cmp of userCmps) {
      const r = cmp(a, b);
      if (r !== 0) return r;
    }
    return 0;
  });
}

/**
 * Binge-pin: lift streams matching the preferred release group to the top of
 * the list, keeping their relative order from the upstream sort. Used when
 * the user has played an earlier episode from group X — we want episode N+1
 * from the same group to be the default pick so playback feels continuous.
 *
 * Honors two sub-prefs once a `preferredGroup` is active:
 *   • `bingeStrictReleaseGroup` — drop everything not from the same group.
 *     Without this, the user's next episode could silently fall back to a
 *     completely different release; with it, the binge sticks.
 *   • `bingeOnlySeasonPacks` — when both group-match AND seasonPack are
 *     true, push singles below the pack so binge-watching from the same
 *     pack stays the default pick. (We don't filter singles out — the
 *     resolver still picks the right file out of the pack, and falling
 *     back to a single-episode of the same group is fine when no pack
 *     candidate exists.)
 *
 * `preferredGroup` is matched case-insensitively; null/undefined disables.
 */
export function pinReleaseGroup(
  streams: ResolvedStream[],
  preferredGroup: string | null | undefined,
  opts?: { strict?: boolean; preferPacks?: boolean },
): ResolvedStream[] {
  if (!preferredGroup) return streams;
  const target = preferredGroup.toLowerCase();
  const matches: ResolvedStream[] = [];
  const rest: ResolvedStream[] = [];
  for (const s of streams) {
    if (s.releaseGroup && s.releaseGroup.toLowerCase() === target) {
      matches.push(s);
    } else {
      rest.push(s);
    }
  }
  // Strict mode → drop non-group candidates entirely. Graceful degrade:
  // if every candidate was from a different group (the user is starting a
  // new arc, or a one-shot release group), fall back to the original list
  // rather than empty — better an inferior match than zero streams.
  if (opts?.strict) {
    if (matches.length > 0) return matches;
    // else: no matches in strict mode → don't punish the user.
  }
  // Pack-first inside the matched group, when requested.
  if (opts?.preferPacks) {
    const packs = matches.filter((s) => s.seasonPack);
    const nonPacks = matches.filter((s) => !s.seasonPack);
    return [...packs, ...nonPacks, ...rest];
  }
  return [...matches, ...rest];
}
