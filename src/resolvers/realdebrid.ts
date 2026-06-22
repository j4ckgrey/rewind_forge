/**
 * Real-Debrid resolver.
 *
 * Flow:
 *   1. checkAvailability: POST /torrents/instantAvailability/{hashes} →
 *      returns a map of hash → cached file lists. Empty = not cached on RD.
 *   2. resolve: POST /torrents/addMagnet → torrentId. Then
 *      POST /torrents/selectFiles/{torrentId} (select all video files), then
 *      GET /torrents/info/{torrentId} → list of restricted links. Then
 *      POST /unrestrict/link → playable HTTP URL.
 *
 * Auth: Bearer token (the user's private API key from real-debrid.com/apitoken).
 *
 * Reference: api.real-debrid.com (public docs). All paths under /rest/1.0.
 */
import type { StreamAccountRow } from "@forge/types";
import type { ResolveHint, Resolver, StreamCandidate } from "../types";
import { fetchAuthed, magnetFromHash, pickFileForEpisode } from "./base";

const RD_HOST = "https://api.real-debrid.com/rest/1.0";

type RdInstantAvailability = Record<string, unknown>;

type RdAddMagnet = { id: string; uri: string };

type RdTorrentInfo = {
  id: string;
  status: string;
  files: Array<{ id: number; path: string; bytes: number; selected: number }>;
  links: string[];
};

type RdUnrestrict = { download: string };

export class RealDebridResolver implements Resolver {
  readonly provider = "realdebrid";
  readonly accepts = ["torrent"] as const;
  // RD retired /torrents/instantAvailability (403 disabled_endpoint) — it can
  // no longer confirm what's cached. The pipeline skips its availability call
  // entirely and treats RD candidates as assumed-available + flagged unverified.
  readonly verifiesCache = false;
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

    // NOTE: Real-Debrid RETIRED /torrents/instantAvailability — it now returns
    // 403 `disabled_endpoint` (error_code 37) for every call. There is no
    // bulk cache-check API anymore, so this will report nothing cached. We
    // still attempt it (in case a user's RD plan/region behaves differently),
    // but bail after the FIRST failed batch instead of hammering the dead
    // endpoint once per 40-hash slice and spamming an identical 403 line.
    const BATCH = 40;
    for (let i = 0; i < torrents.length; i += BATCH) {
      const slice = torrents.slice(i, i + BATCH);
      const path = slice.map((c) => c.infoHash!).join("/");
      const data = await fetchAuthed<RdInstantAvailability>(
        `${RD_HOST}/torrents/instantAvailability/${path}`,
        this.apiKey,
        { signal, label: "Real-Debrid" },
      );
      // null = the endpoint failed (almost certainly the permanent
      // disabled_endpoint 403). One failure means every batch will fail the
      // same way — stop here so the log carries a single clear line.
      if (data === null) break;
      for (const c of slice) {
        const node = data[c.infoHash!];
        // RD returns an object keyed by host with file lists when cached, or
        // an empty array/object when not cached. Anything non-empty = cached.
        out.set(c.id, isCached(node));
      }
    }
    return out;
  }

  async resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: ResolveHint,
  ): Promise<string | null> {
    if (!this.apiKey || !candidate.infoHash) return null;

    // 1. Add magnet
    const addBody = new URLSearchParams({ magnet: magnetFromHash(candidate.infoHash) });
    const added = await fetchAuthed<RdAddMagnet>(`${RD_HOST}/torrents/addMagnet`, this.apiKey, {
      method: "POST",
      body: addBody,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal,
    });
    if (!added?.id) return null;

    // 2. Select all video files. The RD UI normally picks the largest; we
    //    pass "all" so we get every restricted link back and can pick the
    //    one matching the requested S×E ourselves.
    await fetchAuthed(`${RD_HOST}/torrents/selectFiles/${added.id}`, this.apiKey, {
      method: "POST",
      body: new URLSearchParams({ files: "all" }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal,
    });

    // 3. Wait for the torrent to flip to `downloaded` (cached). Poll a few
    //    times — cached torrents flip instantly, uncached ones never will
    //    within our budget, so bail after ~6s.
    let info: RdTorrentInfo | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      info = await fetchAuthed<RdTorrentInfo>(
        `${RD_HOST}/torrents/info/${added.id}`,
        this.apiKey,
        { signal },
      );
      if (info?.status === "downloaded" && info.links?.length) break;
      await sleep(2000);
    }
    if (!info?.links?.length) return null;

    // 4. Pick the right file by S×E hint. RD orders links in the same
    //    sequence as `files` (filtered to selected==1), so the index of
    //    our chosen file maps directly to a link.
    const videoFiles = info.files
      .map((f, i) => ({ ...f, _origIdx: i }))
      .filter((f) => f.selected === 1);
    if (videoFiles.length === 0) return null;
    const pickable = videoFiles.map((f) => ({
      id: f._origIdx,
      // f.path is "/folder/Show.S01E05.mkv" — last segment is the filename.
      name: f.path.split("/").pop() ?? f.path,
      size: f.bytes,
    }));
    const chosen = pickFileForEpisode(pickable, hint);
    if (!chosen) return null;
    // Map back: the link index is the position of this file within the
    // selected (==1) subset, NOT its position within `info.files`.
    const selectedIdx = videoFiles.findIndex((f) => f._origIdx === chosen.id);
    if (selectedIdx < 0) return null;
    const link = info.links[selectedIdx];
    if (!link) return null;

    const unrestricted = await fetchAuthed<RdUnrestrict>(
      `${RD_HOST}/unrestrict/link`,
      this.apiKey,
      {
        method: "POST",
        body: new URLSearchParams({ link }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
      },
    );
    return unrestricted?.download ?? null;
  }
}

function isCached(node: unknown): boolean {
  if (!node) return false;
  if (Array.isArray(node)) return node.length > 0;
  if (typeof node === "object") return Object.keys(node as object).length > 0;
  return false;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
