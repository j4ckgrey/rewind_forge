/**
 * Shared helpers for StreamSource adapters.
 */
import { createHash } from "node:crypto";
import type { StreamSourceRow } from "@forge/types";
import { logger } from "@forge/log";

/** Deterministic id for a candidate, derived from its source-local key. */
export function candidateId(sourceId: string, sourceLocalKey: string): string {
  return createHash("md5").update(`${sourceId}:${sourceLocalKey}`).digest("hex");
}

// ─── Failure-visible HTTP logging ─────────────────────────────────────────────
// Indexers fail silently far too easily (bad API key → 401, rate limit → 429,
// indexer down → 5xx, slow → timeout). The old helpers swallowed all of these
// to `null`, so the pipeline just saw "0 results" with no clue why. We now log
// every non-2xx + every transport error under the "streams" category so the
// admin Logs tab shows exactly which source broke and how. Secrets in the URL
// (apikey / passkey / token) are redacted first.

const SECRET_PARAM_RE =
  /([?&](?:apikey|api_key|apitoken|token|auth_token|passkey|password|pass|key|secret)=)[^&#]*/gi;

/** Strip credentials out of a URL before it reaches a log line. */
export function redactUrl(url: string): string {
  let out = url.replace(SECRET_PARAM_RE, "$1•••");
  // Some indexers embed the key as a path segment (…/<apikey>/api). Best-effort
  // mask of long hex/base32-ish path segments.
  out = out.replace(/\/([A-Za-z0-9]{20,})(?=\/|$)/g, "/•••");
  return out;
}

/** A short, log-friendly label for a source from an explicit name or the host. */
function hostLabel(url: string, label?: string): string {
  if (label) return label;
  try {
    return new URL(url).host;
  } catch {
    return "source";
  }
}

/** Classify a fetch failure (DNS / refused / timeout / TLS) for the log. */
export function describeFetchFailure(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.name === "TimeoutError") return "timed out / aborted";
    const cause = (err as { cause?: { code?: string; message?: string } }).cause;
    return cause?.code || cause?.message || err.message || err.name;
  }
  return String(err);
}

/** JSON-parse a stream_sources config blob safely. */
export function readSourceConfig<T extends Record<string, unknown>>(
  row: StreamSourceRow,
  fallback: T,
): T {
  if (!row.config_json) return fallback;
  try {
    const parsed = JSON.parse(row.config_json) as Partial<T>;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

type FetchOpts = {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Human label for logs (e.g. "Torznab · MyIndexer"). Defaults to the host. */
  label?: string;
};

/** Fetch with timeout + failure logging. Returns the raw body string on 2xx,
 *  or null after logging the status/error. Shared by fetchJson/fetchText so
 *  every source HTTP call surfaces failures identically. */
async function loggedFetch(url: string, opts: FetchOpts): Promise<string | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), opts.timeoutMs ?? 20_000);
  if (opts.signal) {
    if (opts.signal.aborted) ac.abort();
    else opts.signal.addEventListener("abort", () => ac.abort(), { once: true });
  }
  const label = hostLabel(url, opts.label);
  try {
    const res = await fetch(url, { signal: ac.signal, headers: opts.headers });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ").trim();
      logger.warn(
        "streams",
        `Indexer ${label} → HTTP ${res.status} ${res.statusText} on ${redactUrl(url)}` +
        (body ? ` · ${body}` : ""),
      );
      return null;
    }
    return await res.text();
  } catch (err) {
    logger.warn("streams", `Indexer ${label} request failed (${describeFetchFailure(err)}) on ${redactUrl(url)}`);
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Common fetch wrapper with a 20-second timeout and JSON parsing. */
export async function fetchJson<T>(url: string, opts: FetchOpts = {}): Promise<T | null> {
  const text = await loggedFetch(url, opts);
  if (text == null) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    logger.warn(
      "streams",
      `Indexer ${hostLabel(url, opts.label)} returned non-JSON on ${redactUrl(url)} · ${text.slice(0, 160).replace(/\s+/g, " ").trim()}`,
    );
    return null;
  }
}

/** Same as fetchJson but for raw text/XML — Torznab returns XML, not JSON. */
export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string | null> {
  return loggedFetch(url, opts);
}
