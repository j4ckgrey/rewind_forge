/**
 * Streams pipeline — top-level orchestration.
 *
 *   query → search across enabled StreamSources (parallel, with timeouts)
 *         → parse release names (sync)
 *         → filter by user prefs
 *         → for torrent/usenet candidates: bulk-check cached availability
 *           on each enabled Resolver, attach `cachedOnDebrid` flag
 *         → sort with user-preferred sort keys
 *         → optional binge-group pin (lift previous-episode's release group)
 *         → persist as media_streams rows (parser metadata included)
 *
 * Resolving to a final HTTP URL happens later, lazily, when the client
 * actually picks a stream in PlaybackInfo — exactly like the legacy probe
 * flow. The pipeline only fetches metadata + cached flags up-front.
 */
import { createHash } from "node:crypto";
import type { StreamAccountRow, StreamSourceRow } from "@forge/types";
import { getForgeHost } from "@forge/host";
import { logger } from "@forge/log";
import { applyAvailabilityFilters, applyFilters, applySeasonEpisodeGate } from "./filter";
import { parseCandidate } from "./parser";
import { buildResolver, prettyProvider, providerTag } from "./resolvers";
import { pinReleaseGroup, sortStreams } from "./sort";
import { buildSource } from "./sources";
import {
  DEFAULT_FORMATTER_CONFIG,
  formatStream,
  type FormatterConfig,
} from "./formatter";
import type {
  ParsedStreamCandidate,
  ResolvedStream,
  Resolver,
  StreamCandidate,
  StreamPrefs,
  StreamQuery,
  StreamSource,
} from "./types";

const DEFAULT_SOURCE_TIMEOUT_MS = 20_000;
const DEFAULT_RESOLVE_TIMEOUT_MS = 30_000;
// Source SEARCH (indexer query) gets a TIGHTER bound than the debrid
// cached-check. A dead/misconfigured indexer (e.g. a self-hosted Comet that
// 404s, or a public one that hangs) otherwise holds the whole fresh
// resolution open for the full 20s — and because every source runs in
// parallel over the single VPN tunnel, that hang also starves the *healthy*
// debrid checkcached enough to trip ITS 20s timeout (→ "0 cached" → 0
// streams on a title that is actually cached). A healthy indexer answers in
// <2s, so 9s is plenty and bounds the damage a bad source can do.
const SOURCE_SEARCH_TIMEOUT_MS = 9_000;

// Per-stage pipeline chatter (Stage 1/2/2a/3/4, per-source, per-resolver) is
// useful when debugging a "why zero streams" report but is pure noise in
// normal operation — one search emits ~10 lines. Gate it behind an env flag;
// the default path emits a single consolidated summary line instead.
const STREAMS_DEBUG = /^(1|true|yes|on)$/i.test(process.env.STREAMS_DEBUG ?? "");
function dbg(message: string) {
  if (STREAMS_DEBUG) logger.info("streams", message);
}

/** "Torrentio 40, Comet 17" from a [label, count] list, dropping zero/empty. */
function breakdown(entries: Array<[string, number]>): string {
  return entries
    .filter(([, n]) => n > 0)
    .map(([label, n]) => `${label} ${n}`)
    .join(", ");
}

/** Capitalise a source adapter id for display ("torrentio" → "Torrentio"). */
function prettySource(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Top-level entry point used by the route layer. Caches results into
 * media_streams so subsequent PlaybackInfo calls don't re-search.
 */
export async function syncNativeStreams(opts: {
  itemId: string;
  query: StreamQuery;
  prefs: StreamPrefs;
  preferredReleaseGroup?: string | null;
  /** Block-based label formatter. Falls back to engine default. */
  formatter?: FormatterConfig;
  /** Episode title to expose to the formatter (series streams only). */
  episodeName?: string | null;
}): Promise<ResolvedStream[]> {
  const { itemId, query, prefs, preferredReleaseGroup, formatter, episodeName } = opts;
  const start = Date.now();

  const [sources, accounts, sourceRows] = await Promise.all([
    loadSources(),
    loadAccounts(),
    loadSourceRows(),
  ]);
  // Resolve a human title up front so every line for this run reads by name
  // (e.g. "The Bear · S03E01 · Tomorrow") instead of a raw item id.
  const title = (await getForgeHost().getMediaItemTitle(itemId)) ?? itemId;

  if (sources.length === 0) {
    logger.warn("streams", `${title} — no enabled stream sources, skipping search`);
    return [];
  }

  dbg(
    `Pipeline start: ${sources.length} sources [${sources.map(s => s.type).join(", ")}], ` +
    `${accounts.length} resolvers [${accounts.map(a => a.row.provider).join(", ")}]`,
  );

  // 1. Search across all sources in parallel. Per-source failures are isolated.
  const { candidates: rawCandidates, perSource } = await searchAll(sources, query);
  dbg(
    `Stage 1 search: ${rawCandidates.length} raw candidates (with infoHash: ` +
    `${rawCandidates.filter(c => c.infoHash).length}, with url: ` +
    `${rawCandidates.filter(c => c.url).length}, with nzb: ` +
    `${rawCandidates.filter(c => c.nzbId).length})`,
  );

  // 2. Parse release-name metadata for every candidate (pure CPU).
  const parsed = rawCandidates.map(parseCandidate);

  // 2b. Season/episode gate — drops candidates that parse to a different
  //     S×E than the user asked for. Without this, sorting picks streams
  //     by resolution/seeders alone and the player ends up showing the
  //     wrong episode (the symptom: "I clicked S01E01 and got S02E05").
  const seGated = applySeasonEpisodeGate(parsed, query);
  if (seGated.length !== parsed.length) {
    dbg(
      `Stage 2a S/E gate: ${parsed.length} → ${seGated.length} ` +
      `(want ${query.kind}${query.season ? ` S${query.season}` : ""}${query.episode ? `E${query.episode}` : ""})`,
    );
  }

  // 3. Apply user filters before the (expensive) cached-availability check.
  //    No point asking RD/AD about candidates the user already excluded.
  const filtered = applyFilters(seGated, prefs);
  dbg(
    `Stage 2 content filter: ${seGated.length} → ${filtered.length} ` +
    `(prefs: resolutions=[${prefs.resolutions.join(",")}], codecs=[${prefs.codecs.join(",")}], ` +
    `hdrAllowed=${prefs.hdrAllowed}, minSeeders=${prefs.minSeeders ?? "any"}, ` +
    `sizeMinMb=${prefs.sizeMinMb ?? "any"}, sizeMaxMb=${prefs.sizeMaxMb ?? "any"})`,
  );

  // 4. Bulk-check availability across all resolvers. We attach cachedOnDebrid
  //    + the preferred resolver_id to each candidate. A candidate may be
  //    cached on multiple debrids — we pick the lowest priority resolver
  //    (= highest preference) that reports it cached.
  const { resolved, perDebrid } = await annotateAvailability(filtered, accounts);
  const cachedCount = resolved.filter(r => r.cachedOnDebrid).length;
  dbg(
    `Stage 3 availability: ${resolved.length} candidates annotated, ` +
    `${cachedCount} reported cached by debrid (${resolved.length - cachedCount} uncached)`,
  );

  // 4b. Drop uncached candidates if the user opted in. STRICT: if the
  //     user enabled cached-only and nothing is cached, deliver an empty
  //     list. The previous "graceful degrade to uncached" behavior
  //     looked friendly but in practice handed the player an unstable
  //     stream (TorBox downloading on-demand) that ECONNRESETs 2–3
  //     minutes in, dropping the user out of playback mid-episode.
  //     Better to surface zero streams and let the user decide than to
  //     silently violate their preference and break playback later.
  const available = applyAvailabilityFilters(resolved, prefs);
  dbg(
    `Stage 4 cached-only filter: ${resolved.length} → ${available.length} ` +
    `(excludeUncached=${prefs.excludeUncached})`,
  );

  // 5. Sort by user prefs, then optionally pin the previous-episode's release
  //    group so binge-watch sticks to the same source. The strict / pack-first
  //    sub-prefs only matter when there IS a preferred group to pin to (i.e.
  //    we're mid-binge), so we collapse them into the call here.
  const sorted = sortStreams(available, prefs);
  const pinned = prefs.bingePinReleaseGroup
    ? pinReleaseGroup(sorted, preferredReleaseGroup ?? null, {
        strict: prefs.bingeStrictReleaseGroup,
        preferPacks: prefs.bingeOnlySeasonPacks,
      })
    : sorted;

  // 6. Persist. Each row carries the resolver_id we'd use to play it; the
  //    actual URL is fetched at play time via resolveStream(). The provider
  //    map lets the formatter stamp each row with its debrid (RD / TB).
  const sourceNameById = new Map(sourceRows.map((r) => [r.id, r.name]));
  const resolverProviderById = new Map(accounts.map((a) => [a.row.id, a.row.provider]));
  await persist(
    itemId,
    pinned,
    formatter ?? DEFAULT_FORMATTER_CONFIG,
    sourceNameById,
    resolverProviderById,
    episodeName,
  );

  // ── One consolidated line per search ─────────────────────────────────────
  // Replaces the old ~10 stage lines. Tells the operator the title, how many
  // streams shipped, where the candidates came from, and — for a multi-debrid
  // setup — how many each debrid reported cached.
  const tookSec = ((Date.now() - start) / 1000).toFixed(1);
  const sourcesStr = breakdown(perSource) || "none";
  // Verified-cached vs assumed (unverifiable providers like RD) reported apart
  // so the operator can tell real cache hits from guesses.
  const verifiedStr = breakdown(
    perDebrid.filter((d) => !d.assumed).map((d) => [prettyProvider(d.provider), d.cached]),
  );
  const assumedStr = breakdown(
    perDebrid.filter((d) => d.assumed).map((d) => [prettyProvider(d.provider), d.cached]),
  );

  if (pinned.length > 0) {
    const cachedPart = verifiedStr ? ` · cached: ${verifiedStr}` : "";
    const assumedPart = assumedStr ? ` · assumed: ${assumedStr}` : "";
    logger.success(
      "streams",
      `${title} — ${pinned.length} streams in ${tookSec}s · sources: ${sourcesStr}${cachedPart}${assumedPart}`,
    );
  } else {
    let why: string;
    if (rawCandidates.length === 0) {
      why = `no candidates from ${sources.length} source${sources.length === 1 ? "" : "s"} (${sourcesStr})`;
    } else if (prefs.excludeUncached && available.length === 0) {
      // Only verifying providers can "empty" the list under cached-only now —
      // non-verifying ones (RD) keep their candidates as assumed.
      const names =
        accounts
          .filter((a) => a.resolver.verifiesCache !== false)
          .map((a) => prettyProvider(a.row.provider))
          .join(" / ") || "debrid";
      why = `${rawCandidates.length} found, none cached on ${names}; cached-only is on`;
    } else {
      why = `${rawCandidates.length} found, all filtered out by your stream prefs`;
    }
    logger.warn("streams", `${title} — 0 streams (${why}) in ${tookSec}s`);
  }
  return pinned;
}

/**
 * Lazily resolve a single cached stream to a playable HTTP URL. Called from
 * PlaybackInfo when the client picks a version.
 *
 * The S/E hint is forwarded to the resolver so it can pick the right file
 * from a season pack instead of defaulting to the largest video — that
 * "largest wins" heuristic was the cause of "I clicked S01E01 and the
 * player loaded S02E05".
 */
export async function resolveStream(
  stream: {
    resolverId: string | null;
    infoHash?: string | null;
    nzbId?: string | null;
    rawTitle?: string;
    sourceId?: string;
  },
  hint?: { season?: number; episode?: number },
): Promise<string | null> {
  if (!stream.resolverId) {
    logger.warn("streams", `Resolve skipped: stream has no resolver assigned (${stream.rawTitle ?? stream.infoHash ?? stream.nzbId ?? "?"})`);
    return null;
  }
  const accounts = await getForgeHost().listStreamAccounts();
  const row = accounts.find((a) => a.id === stream.resolverId && a.enabled === 1);
  if (!row) {
    logger.warn("streams", `Resolve failed: assigned resolver ${stream.resolverId} is missing or disabled`);
    return null;
  }
  const resolver = buildResolver(row);
  if (!resolver) {
    logger.warn("streams", `Resolve failed: ${row.provider} resolver could not be built`);
    return null;
  }
  const candidate: StreamCandidate = {
    id: stream.infoHash ?? stream.nzbId ?? "",
    sourceType: "cache",
    sourceId: stream.sourceId ?? "",
    name: row.provider,
    description: stream.rawTitle ?? "",
    rawTitle: stream.rawTitle ?? "",
    infoHash: stream.infoHash ?? undefined,
    nzbId: stream.nzbId ?? undefined,
  };
  const kind = stream.infoHash ? "torrent" : stream.nzbId ? "usenet" : "direct";
  const ref = stream.infoHash ? stream.infoHash.slice(0, 8) : stream.nzbId ?? "?";
  const t0 = Date.now();
  try {
    const url = await resolver.resolve(
      candidate,
      AbortSignal.timeout(DEFAULT_RESOLVE_TIMEOUT_MS),
      hint,
    );
    if (url) {
      logger.success("streams", `Resolved ${kind} via ${row.provider} (${ref}) in ${Date.now() - t0}ms`);
    } else {
      // Null = provider gave us nothing playable (not cached, no matching file,
      // or an HTTP error already logged above by fetchAuthed).
      logger.warn("streams", `Resolve returned no URL: ${row.provider} could not play ${kind} ${ref} (${stream.rawTitle ?? ""})`.trim());
    }
    return url;
  } catch (err) {
    logger.error("streams", `Resolve threw for ${row.provider} ${kind} ${ref}: ${(err as Error).message}`, err);
    return null;
  }
}

// ─── Internals ───────────────────────────────────────────────────────────────

async function loadSources(): Promise<StreamSource[]> {
  const rows = await getForgeHost().listStreamSources();
  const enabled = rows.filter((r) => r.enabled === 1);
  return enabled.map(buildSource).filter((s): s is StreamSource => s !== null);
}

async function loadAccounts(): Promise<{ row: StreamAccountRow; resolver: Resolver }[]> {
  const rows = await getForgeHost().listStreamAccounts();
  return rows
    .filter((r) => r.enabled === 1)
    .map((row) => ({ row, resolver: buildResolver(row) }))
    .filter((x): x is { row: StreamAccountRow; resolver: Resolver } => x.resolver !== null);
}

/** Raw source rows — needed by the formatter to resolve `{addon}` to a
 *  human name (e.g. "Comet", "Torrentio"). Cheaper than re-loading per
 *  candidate inside persist(). */
async function loadSourceRows(): Promise<StreamSourceRow[]> {
  const rows = await getForgeHost().listStreamSources();
  return rows.filter((r) => r.enabled === 1);
}

async function searchAll(
  sources: StreamSource[],
  query: StreamQuery,
): Promise<{ candidates: StreamCandidate[]; perSource: Array<[string, number]> }> {
  // Per-source raw counts for the summary line ("sources: Torrentio 40, …").
  const perSource: Array<[string, number]> = [];
  const results = await Promise.all(
    sources.map(async (s) => {
      const t0 = Date.now();
      const signal = AbortSignal.timeout(SOURCE_SEARCH_TIMEOUT_MS);
      try {
        const res = await s.search(query, signal);
        dbg(`Source ${prettySource(s.type)} → ${res.length} candidates in ${Date.now() - t0}ms`);
        perSource.push([prettySource(s.type), res.length]);
        return res;
      } catch (err) {
        // Failures stay loud (warn, always) — pairs with the HTTP-level logs
        // in sources/base so a bad key shows as "0 + HTTP 401".
        logger.warn("streams", `Source ${prettySource(s.type)} failed after ${Date.now() - t0}ms: ${(err as Error).message}`);
        perSource.push([prettySource(s.type), 0]);
        return [];
      }
    }),
  );
  // Deduplicate by (infoHash || nzbId || url). Same release surfaced across
  // multiple sources is one candidate — but we keep the FIRST source's
  // metadata since per-source ordering tends to surface the strongest result
  // (most seeders, best tracker) first.
  const seen = new Set<string>();
  const out: StreamCandidate[] = [];
  for (const list of results) {
    for (const c of list) {
      const key = c.infoHash ?? c.nzbId ?? c.url ?? c.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
  }
  return { candidates: out, perSource };
}

async function annotateAvailability(
  candidates: ParsedStreamCandidate[],
  accounts: { row: StreamAccountRow; resolver: Resolver }[],
): Promise<{
  resolved: ResolvedStream[];
  perDebrid: Array<{ provider: string; cached: number; assumed?: boolean }>;
}> {
  // Candidates that already have a URL skip the resolver entirely — the
  // upstream source (Comet pre-resolved, EasyNews, external addon, …)
  // has already done whatever debrid/cache check was needed and handed
  // back a ready-to-play URL.
  //
  // CRITICAL: these direct URLs MUST be marked cached. Comet only
  // returns a pre-resolved URL when it has confirmed cache availability
  // upstream (using the debrid API key we passed it in `debridServices`).
  // The uncached path emits `infoHash` instead and routes through our
  // own resolver. So in practice:
  //   - candidate has url, no infoHash → Comet/EasyNews said "this is
  //     ready right now" → cached.
  //   - candidate has infoHash, no url → uncached, route through resolver
  //     and let the resolver tell us if any of OUR debrids have it cached.
  //
  // The previous `cachedOnDebrid: false` here caused every Comet result
  // to be misclassified as uncached, which then collided with the
  // excludeUncached filter (cached-only mode emptied the list) and the
  // legacy fallback delivered them anyway — but mislabeled, so the UI
  // showed "0 cached" even when every candidate was actually cached.
  const direct: ResolvedStream[] = [];
  const needsResolver: ParsedStreamCandidate[] = [];
  for (const c of candidates) {
    if (c.url) {
      direct.push({ ...c, url: c.url, resolverId: null, cachedOnDebrid: true });
    } else {
      needsResolver.push(c);
    }
  }
  if (needsResolver.length === 0 || accounts.length === 0) {
    // Direct streams plus any unresolvable candidates passed through with no
    // URL — those won't be playable but stay in the list so the admin can see
    // what an indexer returned.
    return {
      resolved: [
        ...direct,
        ...needsResolver.map<ResolvedStream>((c) => ({
          ...c,
          url: "",
          resolverId: null,
          cachedOnDebrid: false,
        })),
      ],
      perDebrid: [],
    };
  }

  // Split resolvers by whether they can actually confirm cache. Non-verifying
  // ones (Real-Debrid, post instantAvailability shutdown) are NOT queried — we
  // skip their dead endpoint entirely and use them only as an "assumed
  // available, unverified" fallback. Priority order: lower = preferred.
  const accountsByPriority = [...accounts].sort((a, b) => a.row.priority - b.row.priority);
  const verifying = accountsByPriority.filter((a) => a.resolver.verifiesCache !== false);
  const nonVerifying = accountsByPriority.filter((a) => a.resolver.verifiesCache === false);
  const torrentCands = needsResolver.filter((c) => c.infoHash);
  const usenetCands = needsResolver.filter((c) => c.nzbId);

  const cacheMaps = await Promise.all(
    verifying.map(async ({ row, resolver }) => {
      const accepts = resolver.accepts;
      const slice: StreamCandidate[] = [
        ...(accepts.includes("torrent") ? torrentCands : []),
        ...(accepts.includes("usenet") ? usenetCands : []),
      ];
      dbg(
        `→ ${prettyProvider(row.provider)} checkAvailability for ${slice.length} candidates ` +
        `(torrent: ${torrentCands.length} accepted=${accepts.includes("torrent")}, ` +
        `usenet: ${usenetCands.length} accepted=${accepts.includes("usenet")})`,
      );
      try {
        const map = await resolver.checkAvailability(slice, AbortSignal.timeout(DEFAULT_SOURCE_TIMEOUT_MS));
        const cachedHere = Array.from(map.values()).filter((v) => v === true).length;
        dbg(`← ${prettyProvider(row.provider)} returned cached map of ${map.size} entries, ${cachedHere} marked cached`);
        return { row, resolver, map };
      } catch (err) {
        logger.warn("streams", `${prettyProvider(row.provider)} checkAvailability threw: ${(err as Error).message}`);
        return { row, resolver, map: new Map<string, boolean>() };
      }
    }),
  );

  let assumedCount = 0;
  const annotated = needsResolver.map<ResolvedStream>((c) => {
    const wantedKind: "torrent" | "usenet" = c.infoHash ? "torrent" : "usenet";

    // 1. Verified cached wins outright (highest-priority verifying resolver
    //    that reports it cached).
    let resolverId: string | null = null;
    for (const { row, resolver, map } of cacheMaps) {
      if (!resolver.accepts.includes(wantedKind)) continue;
      if (map.get(c.id) === true) {
        return { ...c, url: "", resolverId: row.id, cachedOnDebrid: true };
      }
      if (resolverId === null) resolverId = row.id; // remember first compatible verifier as uncached fallback
    }

    // 2. Nothing verified it cached. A non-verifying provider (RD) that accepts
    //    this kind takes it as ASSUMED available + flagged unverified, so it
    //    survives cached-only instead of being silently dropped.
    const assumed = nonVerifying.find((a) => a.resolver.accepts.includes(wantedKind));
    if (assumed) {
      assumedCount += 1;
      return { ...c, url: "", resolverId: assumed.row.id, cachedOnDebrid: false, assumedCached: true };
    }

    // 3. Otherwise it's a genuine uncached candidate on a verifying resolver.
    return { ...c, url: "", resolverId, cachedOnDebrid: false };
  });

  // Cached count per VERIFYING debrid for the summary line. A candidate cached
  // on multiple debrids counts in each bucket — that's intentional (it answers
  // "what does each provider have", not a deduped total). Non-verifying
  // providers (RD) report their assumed total instead of a verified count.
  const perDebrid: Array<{ provider: string; cached: number; assumed?: boolean }> =
    cacheMaps.map(({ row, map }) => ({
      provider: row.provider,
      cached: Array.from(map.values()).filter((v) => v === true).length,
    }));
  for (const { row } of nonVerifying) {
    perDebrid.push({ provider: row.provider, cached: assumedCount, assumed: true });
  }

  return { resolved: [...direct, ...annotated], perDebrid };
}

async function persist(
  itemId: string,
  streams: ResolvedStream[],
  formatter: FormatterConfig,
  sourceNameById: Map<string, string>,
  resolverProviderById: Map<string, string>,
  episodeName?: string | null,
): Promise<void> {
  await getForgeHost().setNativeStreams(
    itemId,
    streams.map((s, i) => {
      const addonName = sourceNameById.get(s.sourceId) ?? s.sourceType;
      // Resolve the debrid this stream would play through so the formatter can
      // stamp the row with "RD" / "TorBox" instead of a generic "[Debrid]".
      const provider = s.resolverId ? resolverProviderById.get(s.resolverId) : null;
      const debridName = provider ? prettyProvider(provider) : null;
      const debridTag = provider ? providerTag(provider) : null;
      const { title, subtitle } = formatStream(s, formatter, {
        addonName,
        episodeName,
        debridName,
        debridTag,
      });
      // Always fall back to the raw release name when the formatter would
      // collapse to an empty title (every category block dropped because
      // the metadata was missing) — better the user sees the filename
      // than a blank row.
      const finalName = title.trim() ? title : s.name;
      const finalDescription = subtitle.trim() ? subtitle : s.description;
      return {
        id: streamRowId(itemId, s),
        url: s.url || `native://${s.infoHash ?? s.nzbId ?? s.id}`,
        name: finalName,
        description: finalDescription,
        // Clean release name — kept distinct from the formatted name/description
        // so JIT resolve hands the resolver a sane label (the formatted one has
        // emoji/newlines that break usenet job submission).
        rawTitle: s.rawTitle || s.name || null,
        bingeGroup: s.bingeGroup ?? null,
        sortIndex: i,
        sourceId: s.sourceId,
        resolverId: s.resolverId,
        infoHash: s.infoHash ?? null,
        nzbId: s.nzbId ?? null,
        releaseGroup: s.releaseGroup,
        resolution: s.resolution,
        codec: s.codec,
        hdrFlags: s.hdrFlags,
        sizeBytes: s.sizeBytes ?? null,
        seeders: s.seeders ?? null,
        cachedOnDebrid: s.cachedOnDebrid,
        languages: s.languages,
        audioChannels: s.audioChannels,
        audioCodec: s.audioCodec,
        sourceTag: s.sourceTag,
      };
    }),
  );
}

function streamRowId(itemId: string, s: ResolvedStream): string {
  // Primary key for media_streams. MUST be scoped per item — two different
  // items can legitimately share a torrent hash (e.g. a trilogy pack appears
  // as a candidate for each individual movie), and without the item prefix
  // the second insert hit a UNIQUE constraint violation.
  const key = s.url || s.infoHash || s.nzbId || s.id;
  return createHash("md5").update(`${itemId}:${key}`).digest("hex");
}
