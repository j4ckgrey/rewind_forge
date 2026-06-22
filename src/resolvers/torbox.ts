/**
 * TorBox resolver — handles BOTH torrent and usenet (NZB) requests because
 * TorBox itself is a unified service for both.
 *
 * TorBox API v1: api.torbox.app/v1/api. Endpoints:
 *   torrent flow:
 *     - GET /torrents/checkcached?hash=…  → cached map
 *     - POST /torrents/createtorrent (magnet) → queue id
 *     - GET /torrents/mylist?id=… → file list with download urls
 *     - GET /torrents/requestdl?token=&torrent_id=&file_id= → final URL
 *   usenet flow:
 *     - POST /usenet/createusenetdownload (file=NZB or link=nzb-url)
 *     - GET /usenet/mylist?id=…
 *     - GET /usenet/requestdl?token=&usenet_id=&file_id=
 *
 * Auth: Bearer api_key.
 */
import type { StreamAccountRow } from "@forge/types";
import type { ResolveHint, Resolver, StreamCandidate } from "../types";
import { fetchAuthed, magnetFromHash, pickFileForEpisode } from "./base";

const TB_HOST = "https://api.torbox.app/v1/api";

type TbCheckResponse = {
  data?: Record<string, { name?: string; size?: number; hash?: string } | null>;
};

type TbCreateResponse = {
  success?: boolean;
  data?: { torrent_id?: number; usenet_id?: number };
};

type TbMyListResponse = {
  data?: {
    id?: number;
    download_state?: string;
    progress?: number; // 0..1
    seeds?: number;
    files?: Array<{ id: number; name: string; size: number; mimetype?: string }>;
  };
};

type TbRequestDlResponse = { data?: string };

/** A torrent TorBox accepted but whose files aren't ready yet — it's queued /
 *  downloading on the debrid (on-demand resolve). `seeds: 0` usually means a
 *  dead torrent that will never finish. */
export type QueuedResolve = {
  queued: true;
  state: string | null;
  /** Download progress 0–100, when TorBox reports it. */
  progress: number | null;
  seeds: number | null;
};

export class TorBoxResolver implements Resolver {
  readonly provider = "torbox";
  readonly accepts = ["torrent", "usenet"] as const;
  private readonly apiKey: string;

  constructor(private readonly row: StreamAccountRow) {
    this.apiKey = row.api_key ?? "";
  }

  async checkAvailability(
    candidates: StreamCandidate[],
    signal?: AbortSignal,
  ): Promise<Map<string, boolean>> {
    const out = new Map<string, boolean>();
    if (!this.apiKey) return out;
    const torrents = candidates.filter((c) => c.infoHash);
    if (torrents.length === 0) return out;

    const BATCH = 75;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const params = new URLSearchParams();
      for (const c of slice) params.append("hash", c.infoHash!);
      const data = await fetchAuthed<TbCheckResponse>(
        `${TB_HOST}/torrents/checkcached?${params.toString()}&format=object`,
        this.apiKey,
        { signal },
      );
      const cached = data?.data ?? {};
      for (const c of slice) out.set(c.id, !!cached[c.infoHash!]);
    }
    return out;
  }

  async resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: ResolveHint,
  ): Promise<string | null> {
    const r = await this.resolveDetailed(candidate, signal, hint);
    return r && "url" in r ? r.url : null;
  }

  /**
   * Like {@link resolve} but also returns the NAME of the file we picked. The
   * adult library uses the name to reject dirty hashlist entries whose cached
   * TorBox content turns out to be unrelated (e.g. a mainstream show) — the
   * torrent's release name matched, but the actual file doesn't.
   *
   * For an UNCACHED torrent TorBox queues the download instead of failing; in
   * that case this returns a {@link QueuedResolve} (state + progress) so the
   * caller can tell the user "it's downloading" rather than "not found".
   */
  async resolveDetailed(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: ResolveHint,
  ): Promise<{ url: string; name: string } | QueuedResolve | null> {
    if (!this.apiKey) return null;
    if (candidate.infoHash) return this.resolveTorrent(candidate, signal, hint);
    if (candidate.nzbId) {
      const url = await this.resolveUsenet(candidate, signal, hint);
      return url ? { url, name: candidate.rawTitle ?? "" } : null;
    }
    return null;
  }

  private async resolveTorrent(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: ResolveHint,
  ): Promise<{ url: string; name: string } | QueuedResolve | null> {
    const body = new FormData();
    body.append("magnet", magnetFromHash(candidate.infoHash!));
    const created = await fetchAuthed<TbCreateResponse>(
      `${TB_HOST}/torrents/createtorrent`,
      this.apiKey,
      { method: "POST", body, signal },
    );
    const id = created?.data?.torrent_id;
    if (!id) return null;

    const info = await pollForReady(
      () => fetchAuthed<TbMyListResponse>(`${TB_HOST}/torrents/mylist?id=${id}&bypass_cache=true`, this.apiKey, { signal }),
    );
    const files = info?.data?.files ?? [];
    if (!files.length) {
      // No files after the poll window — the torrent is queued/downloading
      // (cached ones surface their files within a couple of seconds).
      const d = info?.data;
      if (!d) return null;
      const progress = typeof d.progress === "number" ? Math.round(d.progress * 100) : null;
      return { queued: true, state: d.download_state ?? null, progress, seeds: d.seeds ?? null };
    }
    // S×E-aware file pick. For a single-file torrent this is a no-op
    // (the only file wins regardless of hint). For a season pack this
    // is what stops the resolver from grabbing the wrong episode.
    const chosen = pickFileForEpisode(files, hint);
    if (!chosen) return null;
    const dl = await fetchAuthed<TbRequestDlResponse>(
      `${TB_HOST}/torrents/requestdl?token=${encodeURIComponent(this.apiKey)}&torrent_id=${id}&file_id=${chosen.id}`,
      this.apiKey,
      { signal },
    );
    return dl?.data ? { url: dl.data, name: chosen.name ?? "" } : null;
  }

  private async resolveUsenet(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: ResolveHint,
  ): Promise<string | null> {
    const body = new FormData();
    body.append("link", candidate.nzbId!);
    const created = await fetchAuthed<TbCreateResponse>(
      `${TB_HOST}/usenet/createusenetdownload`,
      this.apiKey,
      { method: "POST", body, signal },
    );
    const id = created?.data?.usenet_id;
    if (!id) return null;
    const info = await pollForReady(
      () => fetchAuthed<TbMyListResponse>(`${TB_HOST}/usenet/mylist?id=${id}&bypass_cache=true`, this.apiKey, { signal }),
    );
    const files = info?.data?.files ?? [];
    if (!files.length) return null;
    const chosen = pickFileForEpisode(files, hint);
    if (!chosen) return null;
    const dl = await fetchAuthed<TbRequestDlResponse>(
      `${TB_HOST}/usenet/requestdl?token=${encodeURIComponent(this.apiKey)}&usenet_id=${id}&file_id=${chosen.id}`,
      this.apiKey,
      { signal },
    );
    return dl?.data ?? null;
  }
}

async function pollForReady(fn: () => Promise<TbMyListResponse | null>): Promise<TbMyListResponse | null> {
  let last: TbMyListResponse | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const info = await fn();
    if (info?.data?.files?.length) return info;
    if (info?.data) last = info; // keep the freshest state for the queued report
    await new Promise<void>((r) => setTimeout(r, 1500));
  }
  return last;
}
