/**
 * Debrid-Link resolver.
 *
 * Debrid-Link API: debrid-link.com/api/v2. Endpoints:
 *   - GET /seedbox/cached?url=magnet... → instant availability
 *   - POST /seedbox/add (url=magnet)     → adds + returns seedbox id
 *   - GET /seedbox/list?ids=…             → file list with download_url
 *
 * Auth: Bearer.
 */
import type { StreamAccountRow } from "@forge/types";
import type { Resolver, StreamCandidate } from "../types";
import { fetchAuthed, magnetFromHash } from "./base";

const DL_HOST = "https://debrid-link.com/api/v2";

type DlCachedResponse = {
  value?: Record<string, boolean>;
};

type DlAddResponse = { value?: { id: string } };
type DlListResponse = {
  value?: Array<{
    id: string;
    files?: Array<{ size: number; downloadUrl?: string; name: string }>;
  }>;
};

export class DebridLinkResolver implements Resolver {
  readonly provider = "debridlink";
  readonly accepts = ["torrent"] as const;
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
    const BATCH = 25;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const params = new URLSearchParams();
      params.set("url", slice.map((c) => magnetFromHash(c.infoHash!)).join(","));
      const data = await fetchAuthed<DlCachedResponse>(
        `${DL_HOST}/seedbox/cached?${params.toString()}`,
        this.apiKey,
        { signal },
      );
      const byHash = data?.value ?? {};
      for (const c of slice) out.set(c.id, byHash[c.infoHash!] === true);
    }
    return out;
  }

  async resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: import("../types").ResolveHint,
  ): Promise<string | null> {
    if (!this.apiKey || !candidate.infoHash) return null;
    const added = await fetchAuthed<DlAddResponse>(
      `${DL_HOST}/seedbox/add`,
      this.apiKey,
      {
        method: "POST",
        body: new URLSearchParams({ url: magnetFromHash(candidate.infoHash) }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
      },
    );
    const id = added?.value?.id;
    if (!id) return null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const list = await fetchAuthed<DlListResponse>(
        `${DL_HOST}/seedbox/list?ids=${id}`,
        this.apiKey,
        { signal },
      );
      const files = list?.value?.[0]?.files ?? [];
      if (files.length) {
        const { pickFileForEpisode } = await import("./base");
        const pickable = files.map((f, i) => ({ id: i, name: f.name, size: f.size }));
        const chosen = pickFileForEpisode(pickable, hint);
        if (chosen) {
          const file = files[chosen.id as number];
          if (file?.downloadUrl) return file.downloadUrl;
        }
      }
      await new Promise<void>((r) => setTimeout(r, 1500));
    }
    return null;
  }
}
