/**
 * Offcloud resolver.
 *
 * Offcloud API: offcloud.com/api. Endpoints:
 *   - POST /cache?apiKey=… body: { hashes: [...] }  → cached map
 *   - POST /cloud?apiKey=… body: { url: magnet }    → requestId
 *   - GET /cloud/explore/{requestId}?apiKey=…       → file list with `url`s
 *
 * Auth: ?apiKey= query string.
 */
import type { StreamAccountRow } from "@forge/types";
import type { Resolver, StreamCandidate } from "../types";
import { fetchAuthed, magnetFromHash } from "./base";

const OC_HOST = "https://offcloud.com/api";

type OcCacheResponse = { cachedItems?: string[] };
type OcAddResponse = { requestId?: string; isDirectLink?: boolean; url?: string };
type OcExploreResponse = string[] | { error?: string };

export class OffcloudResolver implements Resolver {
  readonly provider = "offcloud";
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
      const data = await fetchAuthed<OcCacheResponse>(
        `${OC_HOST}/cache?apiKey=${encodeURIComponent(this.apiKey)}`,
        this.apiKey,
        {
          method: "POST",
          headerScheme: "raw",
          body: JSON.stringify({ hashes: slice.map((c) => c.infoHash!) }),
          headers: { "Content-Type": "application/json" },
          signal,
        },
      );
      const cached = new Set((data?.cachedItems ?? []).map((h) => h.toLowerCase()));
      for (const c of slice) out.set(c.id, cached.has(c.infoHash!));
    }
    return out;
  }

  async resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: import("../types").ResolveHint,
  ): Promise<string | null> {
    if (!this.apiKey || !candidate.infoHash) return null;
    const added = await fetchAuthed<OcAddResponse>(
      `${OC_HOST}/cloud?apiKey=${encodeURIComponent(this.apiKey)}`,
      this.apiKey,
      {
        method: "POST",
        headerScheme: "raw",
        body: JSON.stringify({ url: magnetFromHash(candidate.infoHash) }),
        headers: { "Content-Type": "application/json" },
        signal,
      },
    );
    if (added?.isDirectLink && added.url) return added.url;
    const id = added?.requestId;
    if (!id) return null;
    const explored = await fetchAuthed<OcExploreResponse>(
      `${OC_HOST}/cloud/explore/${id}?apiKey=${encodeURIComponent(this.apiKey)}`,
      this.apiKey,
      { headerScheme: "raw", signal },
    );
    if (!Array.isArray(explored) || explored.length === 0) return null;
    // Offcloud returns URLs as a flat string array — no size, just the
    // last path segment as the filename. Use the S/E parser to pick the
    // URL whose filename matches the requested episode; fall back to
    // the longest filename (correlates with the main file vs. samples).
    if (hint?.episode || hint?.season) {
      const { parseSeasonEpisode } = await import("../parser");
      const match = explored.find((url) => {
        const name = decodeURIComponent(url.split("/").pop() ?? "");
        const p = parseSeasonEpisode(name);
        if (hint.season && p.seasons.length > 0 && !p.seasons.includes(hint.season)) return false;
        if (hint.episode && !p.episodes.includes(hint.episode)) return false;
        return true;
      });
      if (match) return match;
    }
    const biggest = [...explored].sort((a, b) => b.length - a.length)[0];
    return biggest ?? null;
  }
}
