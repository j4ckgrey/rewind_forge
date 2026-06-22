/**
 * NZBDav resolver — usenet streaming server.
 *
 * NZBDav doesn't expose a single-call "give me a stream URL for this NZB"
 * endpoint. Instead it exposes:
 *   1. A SABnzbd-compatible API at `${host}/api` for submitting NZBs and
 *      polling job status. Auth: `apikey` query param or `x-api-key` header.
 *      - mode=addurl&name=<nzbUrl>&cat=<Movies|TV>&output=json
 *          → { status: true, nzo_ids: [<id>] }
 *      - mode=history&nzo_ids=<id>&output=json
 *          → { history: { slots: [{ nzo_id, status, name, storage, ... }] } }
 *   2. A WebDAV-style HTTP tree at `${host}/content/<category>/<basename>/…`
 *      that exposes each completed job's files. We PROPFIND the folder to
 *      find a video file, then return the file URL with optional WebDAV
 *      basic auth embedded so the rewind proxy can replay it.
 *
 * Because the rewind pipeline requires resolve() to return a single URL
 * synchronously, the resolver does the submit → poll → pick-file dance in
 * one call. Worst-case wait is bounded by maxWaitMs.
 *
 * Config blob (stored in `stream_accounts.config_json`):
 *   {
 *     publicHost?: string,        // public URL used by the player; falls
 *                                  // back to host when omitted (set this
 *                                  // when NZBDav lives behind a different
 *                                  // public hostname than the rewind server).
 *     webdavUser?: string,        // basic-auth user for WebDAV access.
 *     webdavPassword?: string,    // basic-auth password.
 *     pollIntervalMs?: number,    // default 2000 ms.
 *     maxWaitMs?: number,         // default 90000 ms.
 *     contentPathPrefix?: string, // default "/content"; override only if
 *                                  // the deployment serves files elsewhere.
 *   }
 */
import type { StreamAccountRow } from "@forge/types";
import { logger } from "@forge/log";
import { pickFileForEpisode } from "./base";
import { describeFetchFailure, redactUrl } from "../sources/base";
import type { ResolveHint, Resolver, StreamCandidate } from "../types";

type NzbDavConfig = {
  publicHost?: string;
  webdavUser?: string;
  webdavPassword?: string;
  pollIntervalMs?: number;
  maxWaitMs?: number;
  contentPathPrefix?: string;
};

type AddUrlResponse = {
  status?: boolean;
  nzo_ids?: string[];
  error?: string | null;
};

type HistorySlot = {
  nzo_id?: string;
  status?: string;
  name?: string;
  category?: string;
  storage?: string | null;
  fail_message?: string;
  bytes?: number;
};

type HistoryResponse = {
  history?: { slots?: HistorySlot[] };
};

const DEFAULT_POLL_MS = 2_000;
const DEFAULT_MAX_WAIT_MS = 90_000;
const DEFAULT_CONTENT_PREFIX = "/content";

export class NzbDavResolver implements Resolver {
  readonly provider: string = "nzbdav";
  readonly accepts = ["usenet"] as const;
  protected readonly host: string;
  protected readonly publicHost: string;
  protected readonly apiKey: string;
  protected readonly webdavUser?: string;
  protected readonly webdavPassword?: string;
  protected readonly pollIntervalMs: number;
  protected readonly maxWaitMs: number;
  protected readonly contentPathPrefix: string;

  constructor(row: StreamAccountRow) {
    this.host = (row.host ?? "").replace(/\/$/, "");
    this.apiKey = row.api_key ?? "";
    const cfg = parseConfig(row.config_json);
    this.publicHost = (cfg.publicHost ?? this.host).replace(/\/$/, "");
    this.webdavUser = cfg.webdavUser;
    this.webdavPassword = cfg.webdavPassword;
    this.pollIntervalMs = cfg.pollIntervalMs ?? DEFAULT_POLL_MS;
    this.maxWaitMs = cfg.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
    this.contentPathPrefix = cfg.contentPathPrefix ?? DEFAULT_CONTENT_PREFIX;
  }

  async checkAvailability(
    candidates: StreamCandidate[],
    _signal?: AbortSignal,
  ): Promise<Map<string, boolean>> {
    // NZBDav doesn't expose a cached-check endpoint. Every NZB the user has
    // an indexer for is potentially streamable — we mark them all as
    // "available" so the pipeline considers them, and the real test is the
    // submit-and-poll in resolve(). Without this the pipeline would silently
    // drop every usenet candidate when only NZBDav is enabled.
    const out = new Map<string, boolean>();
    for (const c of candidates) if (c.nzbId) out.set(c.id, true);
    return out;
  }

  async resolve(
    candidate: StreamCandidate,
    signal?: AbortSignal,
    hint?: ResolveHint,
  ): Promise<string | null> {
    if (!this.host || !candidate.nzbId) return null;

    const category = pickCategory(hint, candidate);
    const jobLabel = sanitiseJobLabel(candidate.rawTitle || candidate.description || candidate.id);

    // 1. Submit the NZB. NZBDav (like SABnzbd) accepts the NZB by URL.
    const added = await this.sabRequest<AddUrlResponse>({
      mode: "addurl",
      name: candidate.nzbId,
      cat: category,
      nzbname: jobLabel,
      output: "json",
    }, signal);
    if (!added?.status || !added.nzo_ids?.length) return null;
    const nzoId = added.nzo_ids[0]!;

    // 2. Poll the SABnzbd history endpoint for completion. NZBDav reports
    //    completed jobs with status="completed" and a `storage` path whose
    //    basename names the WebDAV folder it created.
    const slot = await this.waitForCompletion(nzoId, signal);
    if (!slot) return null;
    const folderName = basename(slot.storage ?? slot.name ?? jobLabel);
    const jobCategory = slot.category ?? category;

    // 3. List files inside that folder over WebDAV and pick the best video
    //    based on the season/episode hint. NZBDav exposes content under
    //    /content/<category>/<basename>/ — the original NZB filenames are
    //    preserved.
    const folderUrl = `${this.host}${this.contentPathPrefix}/${encodeSegment(jobCategory)}/${encodeSegment(folderName)}`;
    const files = await this.listWebdavFiles(folderUrl, signal);
    if (!files.length) return null;
    const chosen = pickFileForEpisode(
      files.map((f, i) => ({ id: i, name: f.name, size: f.size })),
      hint,
    );
    if (!chosen) return null;
    const chosenFile = files[chosen.id as number]!;

    // 4. Build the playable URL on the public host with basic auth (if any).
    const publicFolder = `${this.publicHost}${this.contentPathPrefix}/${encodeSegment(jobCategory)}/${encodeSegment(folderName)}`;
    return embedBasicAuth(`${publicFolder}/${encodeSegment(chosenFile.name)}`, this.webdavUser, this.webdavPassword);
  }

  protected async sabRequest<T>(
    params: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<T | null> {
    const sp = new URLSearchParams({ ...params, apikey: this.apiKey });
    const url = `${this.host}${this.sabApiPath()}?${sp.toString()}`;
    try {
      const res = await fetch(url, {
        headers: { "x-api-key": this.apiKey },
        signal,
      });
      if (!res.ok) {
        const body = (await res.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ").trim();
        const hint = res.status === 401 || res.status === 403 ? " — check the API key" : "";
        logger.warn(
          "streams",
          `Usenet ${this.host} (SABnzbd mode=${params.mode ?? "?"}) → HTTP ${res.status} ${res.statusText}${hint} on ${redactUrl(url)}` +
          (body ? ` · ${body}` : ""),
        );
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      logger.warn("streams", `Usenet ${this.host} (SABnzbd mode=${params.mode ?? "?"}) request failed (${describeFetchFailure(err)})`);
      return null;
    }
  }

  /** Override point so AltMount can swap to its own API path. */
  protected sabApiPath(): string {
    return "/api";
  }

  private async waitForCompletion(
    nzoId: string,
    signal?: AbortSignal,
  ): Promise<HistorySlot | null> {
    const deadline = Date.now() + this.maxWaitMs;
    while (Date.now() < deadline) {
      if (signal?.aborted) return null;
      const history = await this.sabRequest<HistoryResponse>({
        mode: "history",
        nzo_ids: nzoId,
        output: "json",
      }, signal);
      const slot = history?.history?.slots?.find((s) => s.nzo_id === nzoId);
      if (slot?.status?.toLowerCase() === "completed") return slot;
      if (slot?.status?.toLowerCase() === "failed") return null;
      await sleep(this.pollIntervalMs, signal);
    }
    return null;
  }

  private async listWebdavFiles(
    folderUrl: string,
    signal?: AbortSignal,
  ): Promise<{ name: string; size: number }[]> {
    // PROPFIND with depth:infinity to flatten nested release folders in one
    // round trip. NZBDav returns a standard multistatus XML response that we
    // parse with regex — installing a full WebDAV client just to read a
    // directory listing isn't worth the dep.
    const headers: Record<string, string> = {
      Depth: "infinity",
      "Content-Type": "application/xml",
    };
    const basic = basicAuthHeader(this.webdavUser, this.webdavPassword);
    if (basic) headers.Authorization = basic;
    try {
      const res = await fetch(folderUrl, { method: "PROPFIND", headers, signal });
      if (!res.ok) {
        logger.warn("streams", `Usenet ${this.host} WebDAV PROPFIND → HTTP ${res.status} ${res.statusText} on ${redactUrl(folderUrl)}`);
        return [];
      }
      const xml = await res.text();
      return parsePropfindFiles(xml, folderUrl);
    } catch (err) {
      logger.warn("streams", `Usenet ${this.host} WebDAV PROPFIND failed (${describeFetchFailure(err)}) on ${redactUrl(folderUrl)}`);
      return [];
    }
  }
}

function parseConfig(raw: string | null | undefined): NzbDavConfig {
  if (!raw) return {};
  try { return JSON.parse(raw) as NzbDavConfig; } catch { return {}; }
}

function pickCategory(hint: ResolveHint | undefined, c: StreamCandidate): string {
  if (hint?.season != null || hint?.episode != null) return "TV";
  const title = (c.rawTitle || c.description || "").toLowerCase();
  return /s\d{2}e\d{2}|season|episode/.test(title) ? "TV" : "Movies";
}

export function sanitiseJobLabel(s: string): string {
  // SABnzbd/NZBDav use the job name as the on-disk folder name AND persist it
  // as a DB entity. Newlines, emoji and control chars (which leak in when the
  // caller passes a formatted display label instead of a raw release name) make
  // NZBDav's entity save throw HTTP 500. Reduce to a plain, filename-safe token:
  // turn control chars/newlines into spaces (keeping word boundaries), then keep
  // printable ASCII only, collapse whitespace, and swap path separators. Keep
  // dots/dashes — they're valid in release names.
  const cleaned = s
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[/\\]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
  return cleaned || "rewind-nzb";
}

function basename(p: string): string {
  const parts = p.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] ?? p;
}

function encodeSegment(s: string): string {
  return s.split("/").map((p) => encodeURIComponent(p)).join("/");
}

function basicAuthHeader(user?: string, pass?: string): string | null {
  if (!user || !pass) return null;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

function embedBasicAuth(url: string, user?: string, pass?: string): string {
  if (!user || !pass) return url;
  return url.replace(/^(https?:\/\/)/i, (m) => `${m}${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`);
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

const VIDEO_EXT = /\.(mkv|mp4|avi|m4v|ts|webm|mov|m2ts)$/i;

export function parsePropfindFiles(xml: string, baseUrl: string): { name: string; size: number }[] {
  // <D:response> blocks. Each describes either a directory (no
  // getcontentlength, or resourcetype contains <D:collection/>) or a file.
  // We strip the namespace prefix (D:, d:, …) to handle servers that pick
  // a different prefix.
  const stripped = xml.replace(/<\/?[a-z0-9]+:/gi, (m) => m.replace(/[a-z0-9]+:/i, ""));
  const items: { name: string; size: number }[] = [];
  const responseRe = /<response>([\s\S]*?)<\/response>/gi;
  let m: RegExpExecArray | null;
  const baseHrefPath = (() => {
    try { return new URL(baseUrl).pathname.replace(/\/$/, ""); } catch { return ""; }
  })();
  while ((m = responseRe.exec(stripped)) !== null) {
    const block = m[1]!;
    const href = /<href>([\s\S]*?)<\/href>/i.exec(block)?.[1]?.trim();
    if (!href) continue;
    const isCollection = /<resourcetype>[\s\S]*?<collection\s*\/?>[\s\S]*?<\/resourcetype>/i.test(block);
    if (isCollection) continue;
    const lengthStr = /<getcontentlength>([\s\S]*?)<\/getcontentlength>/i.exec(block)?.[1]?.trim();
    const size = lengthStr ? parseInt(lengthStr, 10) || 0 : 0;
    // Derive the filename from the last href segment so we don't have to
    // trust displayname (some servers omit it).
    let hrefPath: string;
    try { hrefPath = new URL(href, baseUrl).pathname; } catch { hrefPath = href; }
    if (baseHrefPath && hrefPath.startsWith(baseHrefPath)) {
      hrefPath = hrefPath.slice(baseHrefPath.length);
    }
    const name = decodeURIComponent(basename(hrefPath));
    if (!name) continue;
    // Skip auxiliary files: subs/nfo/text. Keep the rest.
    if (!VIDEO_EXT.test(name) && size < 50 * 1024 * 1024) continue;
    items.push({ name, size });
  }
  return items;
}
