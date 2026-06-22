/**
 * Shared helpers for Resolver adapters.
 */
import type { StreamAccountRow } from "@forge/types";
import { logger } from "@forge/log";
import { describeFetchFailure, redactUrl } from "../sources/base";
import { parseSeasonEpisodeLib as parseSeasonEpisode } from "../parser";

export async function fetchAuthed<T>(
  url: string,
  apiKey: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    headerScheme?: "bearer" | "x-api-key" | "raw" | "query";
    queryKeyName?: string;
    body?: BodyInit | null;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    timeoutMs?: number;
    /** Provider name for logs (e.g. "TorBox", "Real-Debrid"). Defaults to host. */
    label?: string;
  } = {},
): Promise<T | null> {
  const scheme = opts.headerScheme ?? "bearer";
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  let finalUrl = url;
  if (scheme === "bearer") headers.Authorization = `Bearer ${apiKey}`;
  else if (scheme === "x-api-key") headers["X-API-KEY"] = apiKey;
  else if (scheme === "raw") headers.Authorization = apiKey;
  else if (scheme === "query") {
    const sep = url.includes("?") ? "&" : "?";
    finalUrl = `${url}${sep}${opts.queryKeyName ?? "auth_token"}=${encodeURIComponent(apiKey)}`;
  }

  const method = opts.method ?? "GET";
  let label = opts.label;
  if (!label) {
    try { label = new URL(url).host; } catch { label = "debrid"; }
  }
  // Never log the raw key, whether it rode in via the query scheme or a custom
  // queryKeyName the generic redactor doesn't know about.
  const safeUrl = redactUrl(finalUrl)
    .replace(
      new RegExp(`([?&]${opts.queryKeyName ?? "auth_token"}=)[^&#]*`, "i"),
      "$1•••",
    )
    // Collapse a long run of redacted path segments (e.g. RD's 40-hash batch
    // lookup) so the log line isn't a wall of "•••/•••/•••/…".
    .replace(/(?:•••\/){3,}•••/g, "•••(batch)");

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), opts.timeoutMs ?? 30_000);
  if (opts.signal) {
    if (opts.signal.aborted) ac.abort();
    else opts.signal.addEventListener("abort", () => ac.abort(), { once: true });
  }
  try {
    const res = await fetch(finalUrl, {
      method,
      headers,
      body: opts.body,
      signal: ac.signal,
    });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ").trim();
      // A provider that has retired an endpoint (Real-Debrid did this to
      // /torrents/instantAvailability — `disabled_endpoint`, error_code 37)
      // returns 403, but it is NOT a key problem. Calling that out as "check
      // the API key" sends operators chasing a non-issue, so detect the
      // disabled-endpoint shape first.
      const disabledEndpoint =
        res.status === 403 && /disabled_endpoint|"error_code"\s*:\s*37/i.test(body);
      const hint =
        disabledEndpoint ? " — endpoint retired by the provider (not a key issue)" :
        res.status === 401 || res.status === 403 ? " — check the API key" :
        res.status === 429 ? " — rate limited" : "";
      logger.warn(
        "streams",
        `Debrid ${label} → HTTP ${res.status} ${res.statusText}${hint} on ${method} ${safeUrl}` +
        (body ? ` · ${body}` : ""),
      );
      return null;
    }
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      logger.warn("streams", `Debrid ${label} returned non-JSON on ${method} ${safeUrl} · ${text.slice(0, 160).replace(/\s+/g, " ").trim()}`);
      return null;
    }
  } catch (err) {
    logger.warn("streams", `Debrid ${label} request failed (${describeFetchFailure(err)}) on ${method} ${safeUrl}`);
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Read the host from a stream_accounts row, with a fallback default. */
export function host(row: StreamAccountRow, fallback: string): string {
  return (row.host || fallback).replace(/\/$/, "");
}

/** Build a magnet URL from an infoHash with a sensible default tracker list.
 *  Most debrid providers will accept either a plain hash or a magnet URI,
 *  but `addMagnet` endpoints traditionally want a magnet URI. */
export function magnetFromHash(infoHash: string): string {
  return `magnet:?xt=urn:btih:${infoHash}`;
}

/**
 * Pick the right file from a debrid pack given an optional season+episode
 * hint. Solves "I clicked S01E01 but the resolver streamed S02E05" by
 * filtering to files whose filename parses to the requested S×E and
 * preferring the largest among the matches; falls back to the largest
 * video file when there's no hint or no S×E in any filename (movies,
 * single-episode packs, etc.).
 *
 * Non-video files (subs, NFO, txt, jpg, ...) are excluded by extension
 * when detectable; otherwise a 50MB minimum size cutoff filters out
 * incidental files inside the pack.
 */
export interface PickableFile {
  id: number | string;
  name: string;
  size: number;
}

const VIDEO_EXT = /\.(mkv|mp4|avi|m4v|ts|webm|mov|m2ts)$/i;
const NON_VIDEO_EXT = /\.(srt|vtt|ass|ssa|sub|idx|nfo|txt|jpg|jpeg|png|gif|html|sfv|md5|pdf|exe)$/i;

export function pickFileForEpisode<T extends PickableFile>(
  files: T[],
  hint?: { season?: number; episode?: number },
): T | null {
  if (!files.length) return null;

  const videos = files.filter((f) => {
    if (NON_VIDEO_EXT.test(f.name)) return false;
    if (VIDEO_EXT.test(f.name)) return true;
    return f.size >= 50 * 1024 * 1024;
  });
  if (!videos.length) {
    return [...files].sort((a, b) => b.size - a.size)[0] ?? null;
  }

  if (hint?.episode || hint?.season) {
    const matches = videos
      .map((f) => ({ f, p: parseSeasonEpisode(f.name) }))
      .filter(({ p }) => {
        if (hint.season && p.seasons.length > 0 && !p.seasons.includes(hint.season)) return false;
        if (hint.episode && !p.episodes.includes(hint.episode)) return false;
        return true;
      })
      .sort((a, b) => b.f.size - a.f.size);
    if (matches.length > 0) return matches[0]!.f;
  }

  return [...videos].sort((a, b) => b.size - a.size)[0] ?? null;
}
