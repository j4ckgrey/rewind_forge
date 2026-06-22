/**
 * Forge host contract.
 *
 * The Forge core (pipeline, sources, resolvers) is pure logic — it never touches
 * a database or a logger directly. Everything it needs from its environment is
 * expressed by this `ForgeHost` interface, which the embedder provides once at
 * startup via `setForgeHost()`.
 *
 *   • In-process (current): rewind_server implements ForgeHost against its own
 *     SQLite (`@/lib/db`) + logger and registers it during bootstrap.
 *   • Out-of-process (Phase 5): the standalone Forge service implements it
 *     against its own storage.
 *
 * This is the seam that lets the Forge live in its own repo without importing
 * rewind_server internals.
 */
import type { StreamAccountRow, StreamSourceRow } from "@forge/types";

export interface ForgeLogger {
  info(category: string, message: string): void;
  success(category: string, message: string): void;
  warn(category: string, message: string): void;
  error(category: string, message: string, error?: unknown): void;
}

/** One persisted stream row (the shape the pipeline hands to setNativeStreams). */
export type PersistedStream = {
  id: string;
  url: string;
  name: string | null;
  description: string | null;
  rawTitle: string | null;
  bingeGroup: string | null;
  sortIndex: number;
  sourceId: string | null;
  resolverId: string | null;
  infoHash: string | null;
  nzbId: string | null;
  releaseGroup: string | null;
  resolution: string | null;
  codec: string | null;
  hdrFlags: number;
  sizeBytes: number | null;
  seeders: number | null;
  cachedOnDebrid: boolean;
  languages: string[];
  audioChannels: string | null;
  audioCodec: string | null;
  sourceTag: string | null;
};

export interface ForgeHost {
  /** Enabled + disabled indexer/source rows. `includeAdult` opts adult rows in. */
  listStreamSources(opts?: { includeAdult?: boolean }): Promise<StreamSourceRow[]>;
  /** Debrid/usenet account rows, optionally filtered by kind. */
  listStreamAccounts(kind?: "debrid" | "usenet"): Promise<StreamAccountRow[]>;
  /** Replace the cached media_streams rows for an item. */
  setNativeStreams(itemId: string, streams: PersistedStream[]): Promise<void>;
  /** Human title for an item id, for log lines. */
  getMediaItemTitle(itemId: string): Promise<string | null>;
  logger: ForgeLogger;
}

let _host: ForgeHost | null = null;

/** Register the host implementation. Called once at startup by the embedder. */
export function setForgeHost(host: ForgeHost): void {
  _host = host;
}

/** Get the registered host, or throw if the embedder forgot to set it. */
export function getForgeHost(): ForgeHost {
  if (!_host) {
    throw new Error(
      "Forge host not configured — call setForgeHost() before using the pipeline",
    );
  }
  return _host;
}

/** True once a host is registered (lets `log` fall back to console pre-setup). */
export function hasForgeHost(): boolean {
  return _host !== null;
}
