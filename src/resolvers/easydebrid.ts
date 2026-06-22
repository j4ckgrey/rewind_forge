/**
 * EasyDebrid resolver.
 *
 * EasyDebrid API: easydebrid.com/api/v1. Endpoints used:
 *   - POST /link/lookup    body: { urls: ["magnet:?xt=urn:btih:HASH", ...] }
 *     → returns cached flags per input URL
 *   - POST /link/generate  body: { url: "magnet:..." }
 *     → returns { files: [{ name, size, url }] }
 *
 * Auth: Bearer api_key.
 */
import type { StreamAccountRow } from "@forge/types";
import type { Resolver, StreamCandidate } from "../types";
import { fetchAuthed, magnetFromHash } from "./base";

const ED_HOST = "https://easydebrid.com/api/v1";

type EdLookupResponse = {
  cached?: boolean[]; // index-aligned with input urls
};

type EdGenerateResponse = {
  files?: Array<{ name: string; size: number; url: string }>;
};

export class EasyDebridResolver implements Resolver {
  readonly provider = "easydebrid";
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
      const data = await fetchAuthed<EdLookupResponse>(
        `${ED_HOST}/link/lookup`,
        this.apiKey,
        {
          method: "POST",
          body: JSON.stringify({ urls: slice.map((c) => magnetFromHash(c.infoHash!)) }),
          headers: { "Content-Type": "application/json" },
          signal,
        },
      );
      const cached = data?.cached ?? [];
      slice.forEach((c, idx) => out.set(c.id, cached[idx] === true));
    }
    return out;
  }

  async resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: import("../types").ResolveHint,
  ): Promise<string | null> {
    if (!this.apiKey || !candidate.infoHash) return null;
    const data = await fetchAuthed<EdGenerateResponse>(
      `${ED_HOST}/link/generate`,
      this.apiKey,
      {
        method: "POST",
        body: JSON.stringify({ url: magnetFromHash(candidate.infoHash) }),
        headers: { "Content-Type": "application/json" },
        signal,
      },
    );
    if (!data?.files?.length) return null;
    const { pickFileForEpisode } = await import("./base");
    const pickable = data.files.map((f, i) => ({ id: i, name: f.name, size: f.size }));
    const chosen = pickFileForEpisode(pickable, hint);
    if (!chosen) return null;
    return data.files[chosen.id as number]?.url ?? null;
  }
}
