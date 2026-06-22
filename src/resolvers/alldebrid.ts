/**
 * AllDebrid resolver.
 *
 * AllDebrid v4 API: api.alldebrid.com/v4. The endpoints we need:
 *   - GET /magnet/instant?magnets[]=…  → cached/uncached per hash
 *   - POST /magnet/upload (single)     → adds magnet, returns magnet.id
 *   - GET /magnet/status?id=…          → file list (with `link`s already
 *                                         restricted; AD restricts in-place)
 *   - GET /link/unlock?link=…          → final HTTP URL
 *
 * Auth: ?apikey= in the query string. AllDebrid does NOT accept bearer.
 *
 * Reference: docs.alldebrid.com.
 */
import type { StreamAccountRow } from "@forge/types";
import type { Resolver, StreamCandidate } from "../types";
import { fetchAuthed, magnetFromHash } from "./base";

const AD_HOST = "https://api.alldebrid.com/v4";

type AdInstantResponse = {
  data?: { magnets?: Array<{ hash?: string; magnet?: string; instant?: boolean }> };
};

type AdUploadResponse = {
  data?: { magnets?: Array<{ id: number; ready?: boolean }> };
};

type AdStatusResponse = {
  data?: {
    magnets?: {
      id: number;
      status: string;
      links?: Array<{ link: string; filename: string; size: number }>;
    };
  };
};

type AdUnlockResponse = { data?: { link: string } };

export class AllDebridResolver implements Resolver {
  readonly provider = "alldebrid";
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
    const hashes = candidates.filter((c) => c.infoHash);
    if (hashes.length === 0) return out;

    // AD accepts up to ~100 magnets per call as repeated `magnets[]=` params.
    const BATCH = 50;
    for (let i = 0; i < hashes.length; i += BATCH) {
      const slice = hashes.slice(i, i + BATCH);
      const params = new URLSearchParams();
      params.set("agent", "rewind");
      for (const c of slice) params.append("magnets[]", c.infoHash!);
      const data = await fetchAuthed<AdInstantResponse>(
        `${AD_HOST}/magnet/instant?${params.toString()}`,
        this.apiKey,
        { headerScheme: "query", queryKeyName: "apikey", signal },
      );
      const byHash = new Map<string, boolean>();
      for (const m of data?.data?.magnets ?? []) {
        if (m.hash) byHash.set(m.hash.toLowerCase(), m.instant === true);
      }
      for (const c of slice) out.set(c.id, byHash.get(c.infoHash!) ?? false);
    }
    return out;
  }

  async resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: import("../types").ResolveHint,
  ): Promise<string | null> {
    if (!this.apiKey || !candidate.infoHash) return null;

    const uploadBody = new URLSearchParams();
    uploadBody.set("agent", "rewind");
    uploadBody.append("magnets[]", magnetFromHash(candidate.infoHash));
    const uploaded = await fetchAuthed<AdUploadResponse>(
      `${AD_HOST}/magnet/upload?apikey=${encodeURIComponent(this.apiKey)}`,
      this.apiKey,
      {
        method: "POST",
        headerScheme: "raw", // already in URL
        body: uploadBody,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
      },
    );
    const mag = uploaded?.data?.magnets?.[0];
    if (!mag?.id) return null;

    // Poll status. AD restricts links in-place, so when status flips to
    // `Ready` the `links` array is populated.
    for (let attempt = 0; attempt < 3; attempt++) {
      const status = await fetchAuthed<AdStatusResponse>(
        `${AD_HOST}/magnet/status?id=${mag.id}&apikey=${encodeURIComponent(this.apiKey)}`,
        this.apiKey,
        { headerScheme: "raw", signal },
      );
      const m = status?.data?.magnets;
      if (m?.links?.length) {
        const { pickFileForEpisode } = await import("./base");
        const pickable = m.links.map((l, i) => ({ id: i, name: l.filename, size: l.size }));
        const chosen = pickFileForEpisode(pickable, hint) ?? pickable[0];
        const link = m.links[chosen!.id as number];
        if (!link) return null;
        const unlocked = await fetchAuthed<AdUnlockResponse>(
          `${AD_HOST}/link/unlock?link=${encodeURIComponent(link.link)}&apikey=${encodeURIComponent(this.apiKey)}`,
          this.apiKey,
          { headerScheme: "raw", signal },
        );
        return unlocked?.data?.link ?? link.link;
      }
      await sleep(2000);
    }
    return null;
  }
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
