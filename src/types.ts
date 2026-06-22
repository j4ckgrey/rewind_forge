/**
 * Native streams pipeline — core types.
 *
 * The pipeline runs in three stages:
 *   1. StreamSource.search() returns raw StreamCandidate[] (torrent hashes,
 *      NZB ids, or already-resolved URLs from an external addon).
 *   2. Resolver.resolve() turns each candidate into a playable HTTP URL via
 *      a debrid or usenet backend. Sources that already produce playable URLs
 *      (external external addons, EasyNews HTTP) skip this stage.
 *   3. The pipeline then runs parser → filter → sort → bingeGroup pinning
 *      and persists the result as media_streams rows.
 */
// ── Persisted row shapes (the Forge owns these) ──────────────────────────────
// The SQLite row shapes for the Forge's own tables. The host (rewind_server, or
// a standalone DB in the out-of-process build) reads/writes them; the Forge core
// only ever sees these plain objects, never the DB. rewind_server re-exports
// them from `@/lib/db` so its existing importers keep working unchanged.

/** A debrid/usenet provider account. One row per (provider, credential). */
export type StreamAccountRow = {
  id: string;
  provider: string;
  kind: "debrid" | "usenet";
  api_key: string | null;
  host: string | null;
  enabled: number;
  priority: number;
  config_json: string;
  premium_until: number | null;
  last_checked_at: number | null;
  last_error: string | null;
  created_at: number;
};

/** A torrent/usenet indexer or external addon source. */
export type StreamSourceRow = {
  id: string;
  source_type: string;
  name: string;
  url: string | null;
  api_key: string | null;
  enabled: number;
  priority: number;
  config_json: string;
  last_checked_at: number | null;
  last_error: string | null;
  created_at: number;
  /** 1 → an "Adult" Forge source (used only by the adult library resolver and
   *  excluded from the normal pipeline). 0/undefined for ordinary indexers. */
  adult?: number;
};

/** Per-user filter & sort preferences (one row per user). */
export type StreamPreferencesRow = {
  user_id: string;
  resolutions_json: string;
  codecs_json: string;
  hdr_allowed: number;
  size_min_mb: number | null;
  size_max_mb: number | null;
  languages_json: string;
  excluded_languages_json: string;
  sort_order_json: string;
  binge_pin_release_group: number;
  min_seeders: number | null;
  exclude_uncached: number;
  binge_only_season_packs: number;
  binge_strict_release_group: number;
  binge_pin_scope: "season" | "series";
  formatter_config_json: string | null;
  updated_at: number;
};

/** What we're looking for: a movie by imdb/tmdb id, or a specific episode. */
export type StreamQuery = {
  kind: "movie" | "series";
  imdbId?: string;
  tmdbId?: string;
  /** For series: 1-based season number. */
  season?: number;
  /** For series: 1-based episode number. */
  episode?: number;
  /** Original title — used as a fallback for sources that don't accept ids. */
  title?: string;
  /** Year, for disambiguating same-title items. */
  year?: number;
};

/** A single raw result from a StreamSource, pre-resolve and pre-filter. */
export type StreamCandidate = {
  /** Source-local id. The pipeline rewrites this to a deterministic URL hash. */
  id: string;
  /** Source adapter id (matches StreamSourceRow.source_type). */
  sourceType: string;
  /** Source row id (UUID in stream_sources). */
  sourceId: string;
  /** Short human-readable label (e.g. "Torrentio · 4K HDR"). Shown in player. */
  name: string;
  /** Long description (filename, seeders, size, etc.). Shown under name. */
  description: string;
  /** Raw filename or title — the parser uses this to extract metadata. */
  rawTitle: string;
  /** Torrent infohash. Set for torrent candidates only. */
  infoHash?: string;
  /** NZB identifier (URL or guid). Set for usenet candidates only. */
  nzbId?: string;
  /** Already-resolved playable URL. Set when no debrid/usenet step is needed. */
  url?: string;
  /** Size in bytes if known. */
  sizeBytes?: number;
  /** Torrent seeder count if known. */
  seeders?: number;
  /** Source-reported binge group tag (same release across a series). */
  bingeGroup?: string;
  /** Addon behaviorHints/extras passthrough for diagnostics. */
  meta?: Record<string, unknown>;
};

/** A candidate after parsing release-name metadata. */
export type ParsedStreamCandidate = StreamCandidate & {
  releaseGroup: string | null;
  resolution: Resolution;
  codec: VideoCodec | null;
  hdrFlags: number; // bitfield: 1=HDR10, 2=DV, 4=HDR10+, 8=HLG
  audioCodec: AudioCodec | null;
  audioChannels: string | null; // "2.0" | "5.1" | "7.1" | "Atmos"
  languages: string[];
  sourceTag: SourceTag | null; // BluRay, WEB-DL, WEBRip, HDTV, DVDRip, etc.
  /** Parsed movie/show title with separators normalised to spaces
   *  ("Dune.Part.Two" → "Dune Part Two"). null when PTT couldn't extract one. */
  parsedTitle: string | null;
  /** Release year if present in the filename. */
  parsedYear: number | null;
  /** Edition tags — "Director's Cut", "Extended", "Theatrical", "IMAX", etc.
   *  PTT returns 0+ of these per release. */
  editions: string[];
  /** Seasons named in the filename. Empty when nothing could be detected. */
  seasons: number[];
  /** Episodes named in the filename. Empty for season packs / movies. */
  episodes: number[];
  /** True when seasons are present but no specific episodes are named — the
   *  candidate is a season pack whose right file is picked at resolve time. */
  seasonPack: boolean;
};

/** A candidate that has been resolved to a playable URL. */
export type ResolvedStream = ParsedStreamCandidate & {
  url: string;
  resolverId: string | null; // null = the source already produced the URL
  cachedOnDebrid: boolean;
  /** True when the assigned resolver CAN'T verify cache (e.g. Real-Debrid
   *  retired instantAvailability) so we assume it's available and flag it as
   *  unverified. Survives the cached-only filter like a cached stream, but the
   *  label shows "?" instead of "+" and it sorts below truly-verified ones. */
  assumedCached?: boolean;
};

export type Resolution = "2160p" | "1080p" | "720p" | "480p" | "unknown";
export type VideoCodec = "h264" | "h265" | "av1" | "vp9" | "mpeg2";
export type AudioCodec = "aac" | "ac3" | "eac3" | "dts" | "dts-hd" | "truehd" | "flac" | "opus" | "mp3";
export type SourceTag = "BluRay" | "Remux" | "WEB-DL" | "WEBRip" | "HDTV" | "DVDRip" | "CAM" | "TS";

export const HDR_FLAG_HDR10 = 1;
export const HDR_FLAG_DV = 2;
export const HDR_FLAG_HDR10_PLUS = 4;
export const HDR_FLAG_HLG = 8;

/**
 * A StreamSource finds candidates for a query. Each implementation knows how
 * to talk to one indexer / addon protocol (Torrentio, Torznab, EasyNews, ...).
 *
 * Implementations are stateless — config comes in via the constructor row.
 */
export interface StreamSource {
  /** Adapter id, e.g. "torrentio". Matches StreamSourceRow.source_type. */
  readonly type: string;
  /** Whether this source emits torrents (needs a debrid Resolver) or already
   *  produces playable URLs (external addon, EasyNews HTTP). */
  readonly kind: "torrent" | "usenet" | "direct";
  search(query: StreamQuery, signal?: AbortSignal): Promise<StreamCandidate[]>;
}

/** Factory: build a StreamSource from a stream_sources row. */
export type StreamSourceFactory = (row: StreamSourceRow) => StreamSource;

/**
 * A Resolver turns an unresolved StreamCandidate (torrent hash or NZB) into a
 * playable HTTP URL via a debrid or usenet provider.
 */
export interface Resolver {
  /** Provider id, e.g. "realdebrid", "torbox", "nzbdav". */
  readonly provider: string;
  /** What kinds of candidates this resolver accepts. */
  readonly accepts: ReadonlyArray<"torrent" | "usenet">;
  /** Whether this provider can actually confirm cache status. Defaults to true
   *  when omitted. Real-Debrid sets this false because it retired its bulk
   *  cache-check endpoint — the pipeline then skips its (now-dead) availability
   *  call and treats its candidates as assumed-available + unverified. */
  readonly verifiesCache?: boolean;
  /** Bulk availability check — return only the candidates this provider can
   *  resolve. Most debrids expose a "cached on RD?" endpoint that batches. */
  checkAvailability(
    candidates: StreamCandidate[],
    signal?: AbortSignal,
  ): Promise<Map<string /* candidate.id */, boolean /* cached */>>;
  /** Resolve a single candidate to a playable URL. Returns null on failure
   *  so the pipeline can fall back to another resolver. The optional
   *  `hint` carries the requested season + episode so resolvers that
   *  receive a season pack from the debrid backend can pick the right
   *  file inside the pack instead of defaulting to the biggest file. */
  resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: ResolveHint,
  ): Promise<string | null>;
}

export interface ResolveHint {
  /** 1-based season number for a series episode request. */
  season?: number;
  /** 1-based episode number for a series episode request. */
  episode?: number;
}

/** Factory: build a Resolver from a stream_accounts row. */
export type ResolverFactory = (row: StreamAccountRow) => Resolver;

/** Per-user filter & sort preferences (deserialized stream_preferences row). */
export type StreamPrefs = {
  resolutions: Resolution[];
  codecs: VideoCodec[]; // empty array = allow all
  hdrAllowed: boolean;
  sizeMinMb: number | null;
  sizeMaxMb: number | null;
  /** Include filter — show ONLY these languages. Empty = allow every language. */
  languages: string[];
  /** Exclude filter — drop these languages. Empty = exclude nothing. */
  excludedLanguages: string[];
  sortOrder: SortKey[];
  bingePinReleaseGroup: boolean;
  minSeeders: number | null;
  /** Hide candidates not reported as cached by any debrid resolver. */
  excludeUncached: boolean;
  /** Binge sub-controls — only meaningful when bingePinReleaseGroup is on. */
  bingeOnlySeasonPacks: boolean;
  bingeStrictReleaseGroup: boolean;
  bingePinScope: "season" | "series";
};

export type SortKey =
  | "resolution"
  | "quality"
  | "cached"
  | "seeders"
  | "size"
  | "size_desc"
  | "name"
  | "source_priority";
