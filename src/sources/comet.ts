/**
 * Comet source — hosted external addon that wraps Zilean (DMM hashlist) +
 * a debrid backend. Convenient for users who don't want to self-host Zilean
 * themselves: a public Comet instance does the scraping and you bring your
 * debrid keys via the URL config.
 *
 * Two ways to configure this source:
 *
 *   1. Custom manifest URL (the easy path): paste a full URL ending in
 *      /manifest.json. We pass-through to it like any other external addon.
 *      Use this when a friend/community has already provisioned a Comet
 *      manifest for you.
 *
 *   2. Auto-built manifest: paste only the Comet host (e.g.
 *      https://comet.elfhosted.com). We base64-encode a config blob that
 *      includes whichever debrid keys you've already saved in the Forge's
 *      `stream_accounts` (Real-Debrid, AllDebrid, Premiumize, TorBox, …) and
 *      hit `${host}/${configB64}/manifest.json`. The shape of that blob is
 *      the same one Comet's frontend produces — see
 *      https://github.com/g0ldyy/comet for reference.
 *
 * Why prefer Comet over a raw Zilean source? Comet runs the scraping on
 * the public instance — no Zilean container needed. Why prefer Zilean over
 * Comet? Self-hosted means no public-instance rate limits or downtime; if
 * you already have Zilean running, point at it directly.
 *
 * Why is this its own source rather than just "external-addon"? Because
 * the URL Comet expects is host-only and the config blob has to be derived
 * server-side from the user's saved debrid accounts every time the source
 * runs — there's no static manifest URL to paste once.
 */
import type { StreamSourceRow } from "@forge/types";
import { getForgeHost } from "@forge/host";
import type {
  StreamCandidate,
  StreamQuery,
  StreamSource,
} from "../types";
import { candidateId, fetchJson, readSourceConfig } from "./base";

const DEFAULT_HOST = "https://comet.elfhosted.com";

// Comet's `debridServices[].service` field uses these identifiers. Map our
// internal provider ids → Comet's vocabulary. Providers not in this map
// aren't supported by Comet itself (e.g. nzbdav — usenet-only).
const COMET_SERVICE_BY_PROVIDER: Record<string, string> = {
  realdebrid: "realdebrid",
  alldebrid: "alldebrid",
  premiumize: "premiumize",
  torbox: "torbox",
  easydebrid: "easydebrid",
  debridlink: "debridlink",
  offcloud: "offcloud",
  // Putio + Pikpak are Comet-supported but we don't have parity resolvers,
  // so leave them out — passing them in would have Comet pre-restore on a
  // service Rewind can't pick up.
};

type CometConfig = {
  /** When set, override the host with this manifest URL verbatim. */
  manifestUrl: string;
  /** When true, also return P2P torrents (no debrid match required). */
  includeP2P: boolean;
  /** When true, drop CAM/TS/screener/etc. server-side. */
  removeTrash: boolean;
  /** Only return debrid-cached results. Comet's own `cachedOnly` flag. */
  cachedOnly: boolean;
  /** Optional access token for private Comet instances (`/s/<token>` path). */
  publicToken: string;
};

type CometStream = {
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  name?: string;
  title?: string;
  description?: string;
  behaviorHints?: { bingeGroup?: string; filename?: string };
  sources?: string[];
};

type CometResponse = { streams?: CometStream[] };

export class CometSource implements StreamSource {
  readonly type = "comet";
  // "direct" because for cached streams Comet returns a pre-resolved debrid
  // URL. Uncached candidates come back with `infoHash` and route through our
  // own debrid resolvers, exactly like external-addon does.
  readonly kind = "direct" as const;

  constructor(private readonly row: StreamSourceRow) {}

  async search(query: StreamQuery, signal?: AbortSignal): Promise<StreamCandidate[]> {
    if (!query.imdbId) return []; // Comet is imdb-id only, like Torrentio.

    const cfg = readSourceConfig<CometConfig>(this.row, {
      manifestUrl: "",
      includeP2P: false,
      removeTrash: true,
      cachedOnly: false,
      publicToken: "",
    });

    const addonType = query.kind === "movie" ? "movie" : "series";
    const id = query.kind === "series" && query.season != null && query.episode != null
      ? `${query.imdbId}:${query.season}:${query.episode}`
      : query.imdbId;

    const base = await this.buildBaseUrl(cfg);
    if (!base) return [];

    const data = await fetchJson<CometResponse>(
      `${base}/stream/${addonType}/${encodeURIComponent(id)}.json`,
      { signal },
    );
    if (!data?.streams?.length) return [];

    // Comet surfaces upstream debrid failures as fake stream entries with a
    // `[❌]` or similar emoji-prefixed name, no infoHash, and a placeholder
    // host URL with no path (e.g. `https://comet.feels.legal`). Treating
    // those as candidates feeds the parser garbage from the error
    // description and the S/E gate drops everything — exactly the
    // "zero streams" symptom. Skip them and emit a single warning so the
    // admin can spot the underlying cause (the message is in
    // `description`, e.g. "torbox: Failed to check account status. 403…").
    const usable: CometStream[] = [];
    for (const s of data.streams) {
      if (!s.url && !s.infoHash) continue;
      // Comet emits a non-stream "click me" entry whose URL points at
      // /debrid-sync/<idx> when scrapeDebridAccountTorrents is enabled — a
      // Stremio-UI affordance to manually refresh the account snapshot.
      // Rewind has no concept of action-button streams, so drop it silently.
      if (isCometSyncTrigger(s)) continue;
      if (isCometErrorStream(s)) {
        const msg = (s.description ?? s.title ?? s.name ?? "").replace(/\s+/g, " ").trim();
         
        console.warn(`[streams:comet] Upstream error: ${msg.slice(0, 200)}`);
        continue;
      }
      usable.push(s);
    }
    return usable.map((s) => buildCandidate(this.row, s));
  }

  /**
   * Build the path-prefix that holds the base64 config (or use the manifest
   * URL the admin pasted, if any). Returns the trimmed base WITHOUT the
   * trailing `/manifest.json` so the search path can be appended directly.
   */
  private async buildBaseUrl(cfg: CometConfig): Promise<string | null> {
    if (cfg.manifestUrl) {
      return cfg.manifestUrl.replace(/\/manifest\.json$/, "").replace(/\/$/, "");
    }
    const host = (this.row.url || DEFAULT_HOST).replace(/\/$/, "");
    const accounts = await getForgeHost().listStreamAccounts("debrid");
    const debridServices = accounts
      .filter((a) => a.enabled === 1 && a.api_key && COMET_SERVICE_BY_PROVIDER[a.provider])
      .map((a) => ({
        service: COMET_SERVICE_BY_PROVIDER[a.provider],
        apiKey: a.api_key ?? "",
      }));
    // Comet still works without any debrid keys when includeP2P is true —
    // it just returns raw torrents. If neither is true we'd be sending an
    // empty config Comet rejects, so skip the call entirely.
    if (debridServices.length === 0 && !cfg.includeP2P) return null;

    const configBlob = {
      maxResultsPerResolution: 0,
      maxSize: 0,
      cachedOnly: cfg.cachedOnly,
      removeTrash: cfg.removeTrash,
      resultFormat: ["all"],
      debridServices,
      enableTorrent: cfg.includeP2P,
      scrapeDebridAccountTorrents: false,
      debridStreamProxyPassword: "",
      languages: { required: [], exclude: [], preferred: [] },
      resolutions: {},
      options: {
        remove_ranks_under: -10000000000,
        allow_english_in_languages: false,
        remove_unknown_languages: false,
      },
    };
    const configB64 = Buffer.from(JSON.stringify(configBlob)).toString("base64");
    const tokenSegment = cfg.publicToken ? `/s/${encodeURIComponent(cfg.publicToken)}` : "";
    return `${host}${tokenSegment}/${configB64}`;
  }
}

/**
 * Returns true when the Comet-emitted stream entry is actually a surfaced
 * upstream-failure message (debrid auth broken, no scrape results, etc.)
 * rather than a real candidate. Heuristic: the `name` begins with one of
 * Comet's error-indicator emoji prefixes, OR the entry has no infoHash and
 * the only URL it carries is the host root (no path past `/`).
 */
function isCometErrorStream(s: CometStream): boolean {
  const name = (s.name ?? "").trim();
  // Comet's known error-indicator prefixes (the `[❌]` we've actually seen
  // in the wild, plus the few other warning glyphs the upstream uses).
  if (/^\[(?:❌|⚠️?|ℹ️?|❗|⛔)\]/u.test(name)) return true;
  const hasHash =
    typeof s.infoHash === "string" && /^[a-f0-9]{40}$/i.test(s.infoHash);
  if (hasHash) return false;
  if (!s.url) return true;
  try {
    const parsed = new URL(s.url);
    // No real stream URL is the bare host with no path — Comet returns
    // exactly that for its error placeholder.
    return parsed.pathname === "/" || parsed.pathname === "";
  } catch {
    return true;
  }
}

/**
 * Returns true when the entry is Comet's "Sync debrid account library now"
 * trigger rather than a playable stream. Identified by the `/debrid-sync/`
 * path segment Comet hardcodes for it, with a name fallback for any future
 * reformatting (`[…🔄] Comet Sync`).
 */
function isCometSyncTrigger(s: CometStream): boolean {
  if (s.url) {
    try {
      if (new URL(s.url).pathname.includes("/debrid-sync/")) return true;
    } catch {
      /* fall through to name heuristic */
    }
  }
  return /🔄\]\s*Comet Sync\b/u.test(s.name ?? "");
}

/**
 * Comet's cached results come back as proxy URLs of the shape
 *   <host>/s/<token>/<cfg>/playback/<INFOHASH>/<a>/<b>/<season>/<episode>?…
 * The infohash is in the path because Comet's playback handler needs it
 * to resolve the file against the user's debrid backend at request
 * time. We pull it out here so we can route the candidate through our
 * OWN TorBox resolver and skip Comet's playback proxy entirely.
 *
 * Why we want to skip Comet's proxy: it's a three-hop chain (TV →
 * shack → comet.jackgrey.click → TorBox CDN) and the comet hop drops
 * long-running connections after ~2 minutes, which is exactly the
 * "ECONNRESET mid-playback" symptom the user hits. Resolving the
 * infohash through TorBox directly gives us a *.torbox.app CDN URL
 * with stable range support — same content, one fewer hop, no
 * mid-stream drops.
 *
 * Returns null when the URL doesn't match the expected playback shape
 * (e.g. a Stremio addon variant or a future Comet path layout) — in
 * that case the caller falls back to using `s.url` as-is.
 */
function extractInfoHashFromCometPlaybackUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const m = url.match(/\/playback\/([a-f0-9]{40})(?:\/|\?|$)/i);
  return m ? m[1].toLowerCase() : null;
}

function buildCandidate(row: StreamSourceRow, s: CometStream): StreamCandidate {
  const rawTitle = s.title ?? s.behaviorHints?.filename ?? s.description ?? "";
  // Comet returns one of two shapes:
  //   - Cached: pre-resolved proxy URL with the infohash baked in the
  //     path, no `infoHash` field set on the response.
  //   - Uncached: `infoHash` set, no `url`.
  // We unify both into a hash-bearing candidate so the pipeline always
  // routes through our TorBox resolver (which gives us a direct CDN URL
  // and avoids Comet's proxy chain).
  const directHash = s.infoHash?.toLowerCase();
  const extractedHash = directHash ?? extractInfoHashFromCometPlaybackUrl(s.url);
  // If we got a hash from the URL, drop the URL — the resolver will
  // produce a fresh, direct TorBox CDN URL at play time. If we couldn't
  // extract one (unfamiliar Comet response shape), keep the URL as a
  // pass-through fallback so the candidate is at least playable today.
  const dropProxyUrl = !!extractedHash && !directHash;
  const localKey = extractedHash ? `${extractedHash}:${s.fileIdx ?? 0}` : (s.url ?? "");
  return {
    id: candidateId(row.id, localKey),
    sourceType: "comet",
    sourceId: row.id,
    name: s.name ?? row.name,
    description: s.description ?? s.title ?? "",
    rawTitle,
    url: dropProxyUrl ? undefined : (s.url ?? undefined),
    infoHash: extractedHash ?? undefined,
    bingeGroup: s.behaviorHints?.bingeGroup,
    meta: { fileIdx: s.fileIdx, trackers: s.sources },
  };
}
