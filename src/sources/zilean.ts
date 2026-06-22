/**
 * Zilean source — DMM (Debrid Media Manager) hashlist scraper.
 *
 * This is the same data Comet leans on under the hood. Comet itself is a
 * Addon-addon wrapper around Zilean + a debrid backend; with our native
 * pipeline already covering debrid availability, parsing, filtering, and
 * sorting, querying Zilean directly gives us "internal Comet" without
 * shipping any of Comet's code.
 *
 * Protocol: `GET /dmm/filtered?Query=…&Year=…&Season=…&Episode=…` returns a
 * flat JSON array of items. Each item carries a `raw_title` (parseable
 * release name) and `info_hash` we hand off to the pipeline's debrid checks.
 *
 * Auth: optional Bearer (only when the user runs Zilean behind an auth
 * proxy — self-hosted instances usually have none).
 *
 * Reference: github.com/iPromKnight/zilean — we use only the documented
 * public REST surface; no code from Zilean or Comet is embedded.
 */
import type { StreamSourceRow } from "@forge/types";
import { candidateId, fetchJson, readSourceConfig } from "./base";
import type {
  StreamCandidate,
  StreamQuery,
  StreamSource,
} from "../types";

type ZileanItem = {
  raw_title?: string;
  parsed_title?: string;
  info_hash?: string;
  // Size sometimes arrives as a numeric byte count, sometimes as a string
  // ("1.5 GB"). Handle both at parse time.
  size?: string | number;
  resolution?: string;
  year?: number;
  season?: number;
  episode?: number;
};

type ZileanConfig = {
  // Optional preferred resolution filter pushed down to Zilean. Empty = no
  // server-side filter (the pipeline still applies its own filters later).
  resolution: string;
};

export class ZileanSource implements StreamSource {
  readonly type = "zilean";
  readonly kind = "torrent" as const;

  constructor(private readonly row: StreamSourceRow) {}

  async search(query: StreamQuery, signal?: AbortSignal): Promise<StreamCandidate[]> {
    if (!this.row.url) return [];
    // Zilean is title-based search (no IMDb id endpoint on /dmm/filtered).
    // The pipeline always passes a title for known items; bail otherwise so
    // we don't spam empty queries.
    if (!query.title) return [];

    const cfg = readSourceConfig<ZileanConfig>(this.row, { resolution: "" });

    const params = new URLSearchParams();
    params.set("Query", query.title);
    if (query.year) params.set("Year", String(query.year));
    if (query.kind === "series") {
      if (query.season != null) params.set("Season", String(query.season));
      if (query.episode != null) params.set("Episode", String(query.episode));
    }
    if (cfg.resolution) params.set("Resolution", cfg.resolution);

    const base = this.row.url.replace(/\/$/, "");
    const headers: Record<string, string> = {};
    if (this.row.api_key) headers.Authorization = `Bearer ${this.row.api_key}`;

    const data = await fetchJson<ZileanItem[]>(
      `${base}/dmm/filtered?${params.toString()}`,
      { signal, headers },
    );
    if (!Array.isArray(data) || data.length === 0) return [];

    return data
      .filter((item): item is ZileanItem & { info_hash: string } => !!item.info_hash)
      .map((item) => buildCandidate(this.row, item));
  }
}

function buildCandidate(
  row: StreamSourceRow,
  item: ZileanItem & { info_hash: string },
): StreamCandidate {
  const rawTitle = item.raw_title ?? item.parsed_title ?? "";
  return {
    id: candidateId(row.id, item.info_hash),
    sourceType: "zilean",
    sourceId: row.id,
    name: row.name,
    description: rawTitle,
    rawTitle,
    infoHash: item.info_hash.toLowerCase(),
    sizeBytes: parseZileanSize(item.size),
    meta: {
      parsedTitle: item.parsed_title,
      year: item.year,
      season: item.season,
      episode: item.episode,
    },
  };
}

/**
 * Zilean's size field has been both numeric (bytes) and string ("1.5 GB")
 * across versions; coerce both shapes here so the rest of the pipeline can
 * treat the field uniformly.
 */
function parseZileanSize(size: string | number | undefined): number | undefined {
  if (size == null) return undefined;
  if (typeof size === "number") return size > 0 ? size : undefined;
  const m = String(size).match(/(\d+(?:[.,]\d+)?)\s*(b|kb|mb|gb|tb|kib|mib|gib|tib)\b/i);
  if (!m) {
    // Bare numeric string — assume bytes.
    const n = parseInt(size, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  const v = parseFloat(m[1]!.replace(",", "."));
  if (!Number.isFinite(v)) return undefined;
  const mult: Record<string, number> = {
    b: 1,
    kb: 1024, kib: 1024,
    mb: 1024 ** 2, mib: 1024 ** 2,
    gb: 1024 ** 3, gib: 1024 ** 3,
    tb: 1024 ** 4, tib: 1024 ** 4,
  };
  return Math.round(v * (mult[m[2]!.toLowerCase()] ?? 1));
}
