/**
 * Torrentio source — public external addon for torrents indexed across many
 * trackers (RARBG, 1337x, ThePirateBay, EZTV, KickassTorrents, etc.).
 *
 * Protocol: standard external addon manifest under torrentio.strem.fun. The
 * stream endpoint returns torrent results with infoHash + fileIdx. We bring
 * our own debrid resolver, so we do NOT use Torrentio's debrid-rewritten URLs
 * — we always read raw infoHash and resolve locally.
 *
 * Config blob:
 *   { configToken?: string }
 *     Optional path token after the host (Torrentio config strings — adds
 *     tracker filters, ratings, etc.). Empty = use defaults.
 */
import type { StreamSourceRow } from "@forge/types";
import { candidateId, fetchJson, readSourceConfig } from "./base";
import type {
  StreamCandidate,
  StreamQuery,
  StreamSource,
} from "../types";

type TorrentioStream = {
  infoHash?: string;
  fileIdx?: number;
  name?: string;
  title?: string;
  description?: string;
  behaviorHints?: { bingeGroup?: string; filename?: string };
  url?: string;
  sources?: string[];
};

type TorrentioResponse = {
  streams?: TorrentioStream[];
};

const DEFAULT_HOST = "https://torrentio.strem.fun";

export class TorrentioSource implements StreamSource {
  readonly type = "torrentio";
  readonly kind = "torrent" as const;

  constructor(private readonly row: StreamSourceRow) {}

  async search(query: StreamQuery, signal?: AbortSignal): Promise<StreamCandidate[]> {
    const cfg = readSourceConfig<{ configToken: string }>(this.row, { configToken: "" });
    // Strip a trailing /manifest.json — people paste the addon's manifest URL
    // (that's what Stremio advertises), and appending /stream/... to it 404s.
    // Any config segment BEFORE manifest.json is kept verbatim. Then trim a
    // stray trailing slash.
    const host = (this.row.url || DEFAULT_HOST)
      .replace(/\/manifest\.json$/i, "")
      .replace(/\/$/, "");
    // Torrentio config tokens are a RAW path segment of `|`-separated key=value
    // pairs (e.g. sort=qualitysize|qualityfilter=480p,scr,cam|providers=yts).
    // They must NOT be percent-encoded — encodeURIComponent turns | = , into
    // %7C %3D %2C and Torrentio's router stops matching → 404. Pass it through
    // raw, only trimming surrounding slashes.
    const tokenPath = cfg.configToken
      ? `/${cfg.configToken.replace(/^\/+|\/+$/g, "")}`
      : "";

    if (!query.imdbId) return []; // Torrentio is imdb-id only.

    const addonType = query.kind === "movie" ? "movie" : "series";
    const streamPath =
      addonType === "movie"
        ? `/stream/movie/${query.imdbId}.json`
        : `/stream/series/${query.imdbId}:${query.season ?? 1}:${query.episode ?? 1}.json`;

    const data = await fetchJson<TorrentioResponse>(`${host}${tokenPath}${streamPath}`, { signal });
    if (!data?.streams?.length) return [];

    return data.streams
      .filter((s): s is TorrentioStream & { infoHash: string } => !!s.infoHash)
      .map((s) => buildCandidate(this.row, s));
  }
}

function buildCandidate(
  row: StreamSourceRow,
  s: TorrentioStream & { infoHash: string },
): StreamCandidate {
  // Torrentio's `title` typically contains the filename + size + seeders on
  // separate lines (with emoji prefixes). Use it as the raw release name for
  // the parser — it's richer than `name` which only carries the addon header.
  const rawTitle = s.title ?? s.behaviorHints?.filename ?? "";
  const sizeBytes = pullSize(rawTitle);
  const seeders = pullSeeders(rawTitle);
  return {
    id: candidateId(row.id, `${s.infoHash}:${s.fileIdx ?? 0}`),
    sourceType: "torrentio",
    sourceId: row.id,
    name: s.name ?? "Torrentio",
    description: rawTitle,
    rawTitle,
    infoHash: s.infoHash.toLowerCase(),
    sizeBytes: sizeBytes ?? undefined,
    seeders: seeders ?? undefined,
    bingeGroup: s.behaviorHints?.bingeGroup,
    meta: { fileIdx: s.fileIdx, trackers: s.sources },
  };
}

function pullSize(text: string): number | null {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(b|kb|mb|gb|tb|kib|mib|gib|tib)\b/i);
  if (!m) return null;
  const v = parseFloat(m[1]!.replace(",", "."));
  if (!Number.isFinite(v)) return null;
  const mult: Record<string, number> = {
    b: 1,
    kb: 1024, kib: 1024,
    mb: 1024 ** 2, mib: 1024 ** 2,
    gb: 1024 ** 3, gib: 1024 ** 3,
    tb: 1024 ** 4, tib: 1024 ** 4,
  };
  return Math.round(v * (mult[m[2]!.toLowerCase()] ?? 1));
}

function pullSeeders(text: string): number | null {
  const m = text.match(/👤\s*(\d+)|seeders?\s*[:=]?\s*(\d+)/i);
  if (!m) return null;
  return parseInt((m[1] ?? m[2])!, 10);
}
