/**
 * EasyNews source — usenet HTTP search.
 *
 * Unlike NewzNab indexers, EasyNews returns direct HTTP URLs to articles via
 * Basic Auth. No NZB submission step is needed, so this source is `direct`
 * (kind = "direct") — the pipeline skips Resolver entirely.
 *
 * Config blob:
 *   { username?: string, password?: string }
 *     Credentials. The HTTP URL we emit embeds them as Basic Auth in the URL
 *     (rewind's HLS/proxy layer reads userinfo from the URL).
 */
import type { StreamSourceRow } from "@forge/types";
import { candidateId, fetchJson, readSourceConfig } from "./base";
import type {
  StreamCandidate,
  StreamQuery,
  StreamSource,
} from "../types";

type EasyNewsConfig = { username: string; password: string };

// Easynews's Solr endpoint returns each result either as an object with named
// fields or — on some response variants — as an array indexed positionally.
// We accept both. The fields we care about:
//   hash (or [0])  — content hash
//   id             — 3-char shard id; required for the DL URL alongside the hash
//   fn (or [10])   — filename without extension
//   extension/ext (or [11]) — file extension, leading "."
//   rawSize/size (or [4])   — bytes
//   sig            — signed token, optional, used for some accounts
type EasyNewsItem = {
  hash?: string;
  id?: string;
  fn?: string;
  extension?: string;
  ext?: string;
  rawSize?: number | string;
  size?: number | string;
  sig?: string;
  width?: number;
  height?: number;
  "0"?: string;
  "4"?: string | number;
  "10"?: string;
  "11"?: string;
  "14"?: string;
};

type EasyNewsResponse = {
  data?: EasyNewsItem[];
  downURL?: string;
  dlFarm?: string;
  dlPort?: string;
};

export class EasyNewsSource implements StreamSource {
  readonly type = "easynews";
  readonly kind = "direct" as const;

  constructor(private readonly row: StreamSourceRow) {}

  async search(query: StreamQuery, signal?: AbortSignal): Promise<StreamCandidate[]> {
    const cfg = readSourceConfig<EasyNewsConfig>(this.row, { username: "", password: "" });
    const user = cfg.username || (this.row.api_key ?? "").split(":")[0] || "";
    const pass = cfg.password || (this.row.api_key ?? "").split(":")[1] || "";
    if (!user || !pass) return [];

    const term = query.kind === "movie"
      ? buildMovieQuery(query)
      : buildEpisodeQuery(query);
    if (!term) return [];

    // Easynews search lives at /2.0/search/solr-search/ (no /advanced suffix —
    // that path 404s). The webapp posts these params; `fty[]=VIDEO` is the
    // PHP-array form the backend expects, plain `fty=` is silently ignored.
    const params = new URLSearchParams({
      fly: "2",
      sb: "1",
      pno: "1",
      pby: "250",
      u: "1",
      chxu: "1",
      chxgx: "1",
      st: "basic",
      gps: term,
      vv: "1",
      safeO: "0",
      s1: "relevance",
      s1d: "-",
      "fty[]": "VIDEO",
    });
    const baseHost = this.row.url || "https://members.easynews.com";
    const url = `${baseHost.replace(/\/$/, "")}/2.0/search/solr-search/?${params.toString()}`;
    const auth = Buffer.from(`${user}:${pass}`).toString("base64");

    const data = await fetchJson<EasyNewsResponse>(url, {
      signal,
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json, text/javascript, */*; q=0.9",
      },
    });
    if (!data?.data?.length) return [];

    const downHost = data.downURL && data.dlFarm && data.dlPort
      ? `${data.downURL}/${data.dlFarm}/${data.dlPort}`
      : null;
    if (!downHost) return [];

    return data.data
      .map((raw) => buildCandidateFromItem(raw, downHost, user, pass, this.row.id, this.row.name))
      .filter((c): c is StreamCandidate => c !== null);
  }
}

function buildCandidateFromItem(
  raw: EasyNewsItem | unknown[],
  downHost: string,
  user: string,
  pass: string,
  rowId: string,
  rowName: string,
): StreamCandidate | null {
  // Pull the fields we need out of either an array-shaped or object-shaped
  // result row. Easynews has shipped both formats over time.
  let hash: string | undefined;
  let id: string | undefined;
  let filename: string | undefined;
  let ext: string | undefined;
  let sizeBytes: number | undefined;

  if (Array.isArray(raw)) {
    hash = typeof raw[0] === "string" ? raw[0] : undefined;
    filename = typeof raw[10] === "string" ? raw[10] : undefined;
    ext = typeof raw[11] === "string" ? raw[11] : undefined;
    const s = raw[4];
    sizeBytes = typeof s === "number" ? s : typeof s === "string" ? parseInt(s, 10) || undefined : undefined;
  } else if (raw && typeof raw === "object") {
    const it = raw as EasyNewsItem;
    hash = it.hash ?? it["0"];
    id = it.id;
    filename = it.fn ?? it["10"];
    ext = it.extension ?? it.ext ?? it["11"];
    const s = it.rawSize ?? it.size ?? it["4"];
    sizeBytes = typeof s === "number" ? s : typeof s === "string" ? parseInt(s, 10) || undefined : undefined;
  }

  if (!hash || !ext) return null;
  const fullName = `${filename ?? ""}${ext}`;
  // The Easynews download URL encodes `<hash><shard-id>.<ext>/<filename>.<ext>`.
  // The shard id is required — omitting it (or using just the hash) returns 404.
  const pathFirst = `${hash}${id ?? ""}${ext}`;
  const directUrl = `${downHost}/${pathFirst}/${encodeURIComponent(fullName)}`;
  // Embed basic auth so the server-side proxy can replay it without extra config.
  const authedUrl = directUrl.replace(
    /^https?:\/\//,
    (m) => `${m}${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`,
  );
  return {
    id: candidateId(rowId, hash),
    sourceType: "easynews",
    sourceId: rowId,
    name: rowName,
    description: fullName,
    rawTitle: fullName,
    url: authedUrl,
    sizeBytes,
  };
}

function buildMovieQuery(query: StreamQuery): string | null {
  if (query.title && query.year) return `${query.title} ${query.year}`;
  if (query.imdbId) return query.imdbId;
  return query.title ?? null;
}

function buildEpisodeQuery(query: StreamQuery): string | null {
  if (!query.title) return query.imdbId ?? null;
  const s = String(query.season ?? 1).padStart(2, "0");
  const e = String(query.episode ?? 1).padStart(2, "0");
  return `${query.title} S${s}E${e}`;
}
