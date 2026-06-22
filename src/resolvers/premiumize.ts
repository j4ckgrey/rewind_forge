/**
 * Premiumize resolver.
 *
 * Premiumize API: www.premiumize.me/api. Endpoints:
 *   - POST /cache/check?items[]=…&apikey=…  → cached map
 *   - POST /transfer/directdl?src=magnet:?xt=…&apikey=…
 *     Returns `content[]` of direct download links (no separate unrestrict
 *     step — Premiumize gives back final URLs immediately).
 */
import type { StreamAccountRow } from "@forge/types";
import type { Resolver, StreamCandidate } from "../types";
import { fetchAuthed, magnetFromHash } from "./base";

const PM_HOST = "https://www.premiumize.me/api";

type PmCacheCheckResponse = {
  status?: string;
  response?: boolean[]; // index-aligned with input items[]
};

type PmDirectDlResponse = {
  status?: string;
  content?: Array<{ path: string; size: number; link: string; stream_link?: string }>;
};

export class PremiumizeResolver implements Resolver {
  readonly provider = "premiumize";
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

    const BATCH = 50;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const params = new URLSearchParams();
      params.set("apikey", this.apiKey);
      for (const c of slice) params.append("items[]", c.infoHash!);
      const data = await fetchAuthed<PmCacheCheckResponse>(
        `${PM_HOST}/cache/check?${params.toString()}`,
        this.apiKey,
        { headerScheme: "raw", method: "POST", signal },
      );
      const arr = data?.response ?? [];
      slice.forEach((c, idx) => out.set(c.id, arr[idx] === true));
    }
    return out;
  }

  async resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: import("../types").ResolveHint,
  ): Promise<string | null> {
    if (!this.apiKey || !candidate.infoHash) return null;
    const params = new URLSearchParams();
    params.set("apikey", this.apiKey);
    params.set("src", magnetFromHash(candidate.infoHash));

    const data = await fetchAuthed<PmDirectDlResponse>(
      `${PM_HOST}/transfer/directdl`,
      this.apiKey,
      {
        method: "POST",
        body: params,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        headerScheme: "raw",
        signal,
      },
    );
    if (!data?.content?.length) return null;
    const { pickFileForEpisode } = await import("./base");
    const pickable = data.content.map((c, i) => ({
      id: i,
      name: c.path.split("/").pop() ?? c.path,
      size: c.size,
    }));
    const chosen = pickFileForEpisode(pickable, hint);
    if (!chosen) return null;
    const file = data.content[chosen.id as number];
    return file?.stream_link ?? file?.link ?? null;
  }
}
