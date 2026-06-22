/**
 * Stream filtering — drops candidates that don't match user prefs.
 *
 * All filters short-circuit on empty preference arrays (= "no restriction"),
 * so a fresh user with default prefs sees every stream every source emits.
 */
import type {
  ParsedStreamCandidate,
  ResolvedStream,
  StreamPrefs,
  StreamQuery,
  VideoCodec,
} from "./types";

type FilterableStream = ParsedStreamCandidate | ResolvedStream;

export function applyFilters<T extends FilterableStream>(
  streams: T[],
  prefs: StreamPrefs,
): T[] {
  return streams.filter((s) => matchesPrefs(s, prefs));
}

/**
 * Drop candidates that point to a different episode than the user asked
 * for. Critical for series playback: without this gate, an indexer like
 * Torrentio can hand back a mix of "S02E05", "S01E01", season packs, and
 * unrelated junk; sorting picks one by resolution/seeders alone and the
 * player ends up showing the wrong episode.
 *
 * Rules:
 *   - Movie request: drop anything whose filename names a season or
 *     episode (it's a series result in the response).
 *   - Series request with explicit season+episode:
 *       • Season pack (seasons present, no episodes): keep when seasons
 *         include the requested season — the resolver will pick the
 *         right file inside the pack later.
 *       • Single-episode candidates: must include the requested episode
 *         AND (if seasons are present) the requested season.
 *       • Candidates that don't carry either field stay — the parser
 *         doesn't always see S/E (Torrentio embeds it in the title
 *         differently per release group), and dropping them silently
 *         would empty the list for sparsely-named addons.
 */
export function applySeasonEpisodeGate<T extends FilterableStream>(
  streams: T[],
  query: Pick<StreamQuery, "kind" | "season" | "episode">,
): T[] {
  if (query.kind === "movie") {
    return streams.filter(
      (s) => s.seasons.length === 0 && s.episodes.length === 0,
    );
  }
  if (query.kind !== "series") return streams;
  const wantedSeason = query.season;
  const wantedEpisode = query.episode;
  if (!wantedSeason && !wantedEpisode) return streams;

  return streams.filter((s) => {
    const hasSeasons = s.seasons.length > 0;
    const hasEpisodes = s.episodes.length > 0;

    // Untagged candidate — keep (parser couldn't see S/E).
    if (!hasSeasons && !hasEpisodes) return true;

    // Season pack — match by season only; resolver picks the file later.
    if (s.seasonPack && wantedSeason) {
      return s.seasons.includes(wantedSeason);
    }

    // Specific episode named — must match. Season is optional (anime).
    if (hasEpisodes && wantedEpisode) {
      if (!s.episodes.includes(wantedEpisode)) return false;
      if (hasSeasons && wantedSeason && !s.seasons.includes(wantedSeason)) {
        return false;
      }
      return true;
    }

    // Season-only candidate without explicit episodes (rare). Match by season.
    if (hasSeasons && wantedSeason) return s.seasons.includes(wantedSeason);

    return true;
  });
}

export function matchesPrefs(stream: FilterableStream, prefs: StreamPrefs): boolean {
  // Resolution gate. "unknown" passes when "unknown" is in the allowlist OR
  // when the user kept the default (all four real resolutions enabled and
  // unknown also enabled). Treating "unknown" as always-pass would mean every
  // un-parseable filename slips through a strict 1080p-only filter.
  if (prefs.resolutions.length > 0 && !prefs.resolutions.includes(stream.resolution)) {
    return false;
  }

  // Codec gate. Empty = allow all. Unknown codec passes only when the list
  // is empty (the user hasn't restricted) — explicit list excludes nulls.
  if (prefs.codecs.length > 0) {
    if (!stream.codec || !prefs.codecs.includes(stream.codec)) return false;
  }

  // HDR gate: when disallowed, reject anything with any HDR flag set.
  if (!prefs.hdrAllowed && stream.hdrFlags > 0) return false;

  // Size gate. Skip when size unknown (so small-indexer results that omit
  // size aren't dropped) — only apply when we have a number.
  if (stream.sizeBytes != null) {
    const mb = stream.sizeBytes / (1024 * 1024);
    if (prefs.sizeMinMb != null && mb < prefs.sizeMinMb) return false;
    if (prefs.sizeMaxMb != null && mb > prefs.sizeMaxMb) return false;
  }

  // Excluded-language gate. Drop a candidate only when EVERY language it
  // carries is on the exclude list — a dual/multi release that still includes
  // a language the user kept survives (mirrors AIOStreams' `.every()`). Empty
  // list = exclude nothing; untagged releases are never dropped here.
  if (prefs.excludedLanguages.length > 0 && stream.languages.length > 0) {
    const allExcluded = stream.languages.every((l) => prefs.excludedLanguages.includes(l));
    if (allExcluded) return false;
  }

  // Include (required) language gate. Empty = no filter. Otherwise require at
  // least one match; untagged releases pass (the parser doesn't tag every
  // English release, and dropping them would empty sparsely-named addons).
  if (prefs.languages.length > 0 && stream.languages.length > 0) {
    const hit = stream.languages.some((l) => prefs.languages.includes(l));
    if (!hit) return false;
  }

  // Seeder threshold. Applies only to torrent candidates that carry a count.
  if (prefs.minSeeders != null && stream.seeders != null) {
    if (stream.seeders < prefs.minSeeders) return false;
  }

  return true;
}

/**
 * Filter applied AFTER availability annotation. Drops candidates the user
 * configured to hide based on resolver-reported cached status. Kept separate
 * from `applyFilters` so the content-level filter can run earlier in the
 * pipeline (before we burn debrid API calls on candidates the user excluded).
 */
export function applyAvailabilityFilters<T extends ResolvedStream>(
  streams: T[],
  prefs: StreamPrefs,
): T[] {
  if (!prefs.excludeUncached) return streams;
  // Keep verified-cached AND assumed-available (providers that can't verify,
  // e.g. Real-Debrid). Dropping the latter would hand cached-only users zero
  // RD streams now that RD retired its cache-check endpoint.
  return streams.filter((s) => s.cachedOnDebrid || s.assumedCached);
}

/** Parse a stream_preferences row into StreamPrefs. */
export function parseStreamPrefs(row: {
  resolutions_json: string;
  codecs_json: string;
  hdr_allowed: number;
  size_min_mb: number | null;
  size_max_mb: number | null;
  languages_json: string;
  excluded_languages_json?: string;
  sort_order_json: string;
  binge_pin_release_group: number;
  min_seeders: number | null;
  exclude_uncached: number;
  binge_only_season_packs?: number;
  binge_strict_release_group?: number;
  binge_pin_scope?: string;
}): StreamPrefs {
  const safeJson = <T>(s: string, fallback: T): T => {
    try { return JSON.parse(s) as T; } catch { return fallback; }
  };
  // Normalize legacy / alternate codec spellings saved before the UI was
  // corrected. "hevc" and "x265" both map to the parser value "h265";
  // "avc" and "x264" to "h264". Unknown aliases are dropped (they would
  // never match anything the parser emits).
  const CODEC_ALIASES: Record<string, string> = {
    hevc: "h265", x265: "h265",
    avc: "h264",  x264: "h264",
  };
  const VALID_CODECS = new Set<string>(["h264", "h265", "av1", "vp9", "mpeg2"]);
  const normalizeCodecs = (raw: string[]): VideoCodec[] =>
    raw
      .map((c) => CODEC_ALIASES[c.toLowerCase()] ?? c)
      .filter((c): c is VideoCodec => VALID_CODECS.has(c));
  const scope = row.binge_pin_scope === "series" ? "series" : "season";
  return {
    resolutions: safeJson(row.resolutions_json, []),
    codecs: normalizeCodecs(safeJson(row.codecs_json, [])),
    hdrAllowed: row.hdr_allowed === 1,
    sizeMinMb: row.size_min_mb,
    sizeMaxMb: row.size_max_mb,
    languages: safeJson(row.languages_json, []),
    excludedLanguages: safeJson(row.excluded_languages_json ?? "[]", []),
    sortOrder: safeJson(row.sort_order_json, ["resolution", "cached", "seeders", "size"]),
    bingePinReleaseGroup: row.binge_pin_release_group === 1,
    minSeeders: row.min_seeders,
    excludeUncached: row.exclude_uncached === 1,
    bingeOnlySeasonPacks: (row.binge_only_season_packs ?? 0) === 1,
    bingeStrictReleaseGroup: (row.binge_strict_release_group ?? 0) === 1,
    bingePinScope: scope,
  };
}
