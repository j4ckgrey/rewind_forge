/**
 * TorBox built-in search — TorBox indexes torrents + usenet itself and
 * returns results that are ready to be queued via the TorBox API. The
 * candidates carry infoHash (or NZB URL) and we pair them with the TorBox
 * resolver downstream.
 *
 * This is one of TorBox's documented endpoints rather than an addon — using
 * it requires a TorBox API key, which we read either from the source row
 * (api_key) OR from the matching stream_accounts row (provider="torbox") so
 * the user only enters their key once.
 *
 * Config blob:
 *   { searchKind?: "torrent" | "usenet" | "both" }
 *     Default "both" — emit both torrent and NZB candidates.
 */
import type { StreamSourceRow } from "@forge/types";
import { candidateId, fetchJson, readSourceConfig } from "./base";
import type {
  StreamCandidate,
  StreamQuery,
  StreamSource,
} from "../types";

type TorBoxSearchItem = {
  raw_title?: string;
  title?: string;
  hash?: string;
  nzb?: string;
  size?: number;
  last_known_seeders?: number;
  last_known_peers?: number;
  magnet?: string;
  tracker?: string;
  type?: "torrent" | "usenet";
  age?: string;
  category?: string;
};

type TorBoxSearchResponse = {
  data?: {
    torrents?: TorBoxSearchItem[];
    nzbs?: TorBoxSearchItem[];
  };
  success?: boolean;
};

const TORBOX_SEARCH_HOST = "https://search-api.torbox.app";

export class TorBoxSearchSource implements StreamSource {
  readonly type = "torbox-search";
  // TorBox search emits both torrents and NZBs in a single response. We mark
  // it as torrent (the dominant case); the per-candidate fields (infoHash vs
  // nzbId) tell the pipeline which resolver category to use.
  readonly kind = "torrent" as const;

  constructor(private readonly row: StreamSourceRow) {}

  async search(query: StreamQuery, signal?: AbortSignal): Promise<StreamCandidate[]> {
    if (!query.imdbId) return [];
    const cfg = readSourceConfig<{ searchKind: "torrent" | "usenet" | "both" }>(this.row, {
      searchKind: "both",
    });
    const apiKey = this.row.api_key ?? "";
    if (!apiKey) return [];

    const tbImdbId = query.imdbId;
    const path = query.kind === "movie"
      ? `/torrents/imdb:${tbImdbId}`
      : `/torrents/imdb:${tbImdbId}?season=${query.season ?? 1}&episode=${query.episode ?? 1}`;

    const data = await fetchJson<TorBoxSearchResponse>(`${TORBOX_SEARCH_HOST}${path}`, {
      signal,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!data?.data) return [];

    const out: StreamCandidate[] = [];
    if (cfg.searchKind !== "usenet" && data.data.torrents?.length) {
      for (const t of data.data.torrents) {
        if (!t.hash) continue;
        out.push({
          id: candidateId(this.row.id, t.hash),
          sourceType: "torbox-search",
          sourceId: this.row.id,
          name: this.row.name,
          description: t.raw_title ?? t.title ?? "",
          rawTitle: t.raw_title ?? t.title ?? "",
          infoHash: t.hash.toLowerCase(),
          sizeBytes: t.size ?? undefined,
          seeders: t.last_known_seeders ?? undefined,
          meta: { tracker: t.tracker, magnet: t.magnet, age: t.age },
        });
      }
    }
    if (cfg.searchKind !== "torrent" && data.data.nzbs?.length) {
      for (const n of data.data.nzbs) {
        if (!n.nzb) continue;
        out.push({
          id: candidateId(this.row.id, n.nzb),
          sourceType: "torbox-search",
          sourceId: this.row.id,
          name: this.row.name,
          description: n.raw_title ?? n.title ?? "",
          rawTitle: n.raw_title ?? n.title ?? "",
          nzbId: n.nzb,
          sizeBytes: n.size ?? undefined,
          meta: { age: n.age },
        });
      }
    }
    return out;
  }
}
