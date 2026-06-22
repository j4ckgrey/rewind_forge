import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StreamAccountRow, StreamSourceRow } from "@forge/types";
import { setForgeHost } from "@forge/host";

// ─── Host stub ──────────────────────────────────────────────────────────────
// The pipeline gets listStreamAccounts/listStreamSources/setNativeStreams +
// getMediaItemTitle + logger from the registered ForgeHost. We register a stub
// host so the test controls what the pipeline sees and can assert what it tries
// to persist. The closures read the current sourceRows/accountRows, which
// beforeEach reassigns per case.

const persisted: Array<{ id: string; rows: unknown[] }> = [];
let sourceRows: StreamSourceRow[] = [];
let accountRows: StreamAccountRow[] = [];

setForgeHost({
  listStreamSources: async () => sourceRows,
  listStreamAccounts: async () => accountRows,
  // The pipeline resolves a human title for its summary line.
  getMediaItemTitle: async (id: string) => id,
  setNativeStreams: async (id: string, rows: unknown[]) => {
    persisted.push({ id, rows });
  },
  logger: { info: () => {}, success: () => {}, warn: () => {}, error: () => {} },
});

import { syncNativeStreams } from "./pipeline";
import type { StreamPrefs } from "./types";

const basePrefs: StreamPrefs = {
  resolutions: [], codecs: [], hdrAllowed: true, sizeMinMb: null, sizeMaxMb: null,
  languages: [], excludedLanguages: [], sortOrder: ["resolution", "cached"], bingePinReleaseGroup: false,
  minSeeders: null, excludeUncached: false, bingeOnlySeasonPacks: false,
  bingeStrictReleaseGroup: false, bingePinScope: "season",
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

beforeEach(() => {
  persisted.length = 0;
  sourceRows = [];
  accountRows = [];
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("syncNativeStreams (pipeline orchestration)", () => {
  it("returns empty list and skips persist when no sources are enabled", async () => {
    sourceRows = [];
    const out = await syncNativeStreams({
      itemId: "item-1",
      query: { kind: "movie", imdbId: "tt1" },
      prefs: basePrefs,
    });
    expect(out).toEqual([]);
    expect(persisted).toHaveLength(0);
  });

  it("end-to-end: torrentio source + torbox resolver → cached annotation + sort + persist", async () => {
    sourceRows = [{
      id: "src-1", source_type: "torrentio", name: "Torrentio",
      url: "https://torrentio.test", api_key: null, enabled: 1, priority: 10,
      config_json: "{}", last_checked_at: null, last_error: null, created_at: 0,
    }];
    accountRows = [{
      id: "acc-tb", provider: "torbox", kind: "debrid", api_key: "key", host: null,
      enabled: 1, priority: 10, config_json: "{}", premium_until: null,
      last_checked_at: null, last_error: null, created_at: 0,
    }];

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("torrentio.test")) {
        return jsonResponse({
          streams: [
            {
              infoHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              title: "Movie.2024.2160p.WEB-DL.x265-GRP\nSize: 5GB\n👤 50",
              name: "Torrentio · 4K",
            },
            {
              infoHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              title: "Movie.2024.1080p.WEB-DL.x264-GRP\nSize: 2GB\n👤 100",
              name: "Torrentio · 1080p",
            },
          ],
        });
      }
      if (String(url).includes("torbox.app") && String(url).includes("checkcached")) {
        // Only the 4K stream is cached on TorBox.
        return jsonResponse({
          data: {
            aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: { name: "cached", size: 5_000_000_000 },
            bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb: null,
          },
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    }));

    const out = await syncNativeStreams({
      itemId: "item-1",
      query: { kind: "movie", imdbId: "tt1", title: "Movie", year: 2024 },
      prefs: basePrefs,
    });

    expect(out).toHaveLength(2);
    // Sort: 4K should come first (resolution wins), and its cachedOnDebrid = true.
    expect(out[0]!.resolution).toBe("2160p");
    expect(out[0]!.cachedOnDebrid).toBe(true);
    expect(out[1]!.resolution).toBe("1080p");
    expect(out[1]!.cachedOnDebrid).toBe(false);

    // Persist call: receives parsed metadata for each row.
    expect(persisted).toHaveLength(1);
    expect(persisted[0]!.id).toBe("item-1");
    const rows = persisted[0]!.rows as Array<{
      url: string; resolverId: string | null; resolution: string;
      cachedOnDebrid: boolean; codec: string;
    }>;
    expect(rows[0]!.resolution).toBe("2160p");
    expect(rows[0]!.resolverId).toBe("acc-tb");
    expect(rows[0]!.codec).toBe("h265");
    // URL is the `native://` placeholder until JIT resolve at playback time —
    // this is the privacy guarantee: we never persist the raw debrid URL until
    // the user actually plays.
    expect(rows[0]!.url.startsWith("native://")).toBe(true);
  });

  it("applies excludeUncached after availability annotation", async () => {
    sourceRows = [{
      id: "src-1", source_type: "torrentio", name: "Torrentio",
      url: "https://torrentio.test", api_key: null, enabled: 1, priority: 10,
      config_json: "{}", last_checked_at: null, last_error: null, created_at: 0,
    }];
    accountRows = [{
      id: "acc-tb", provider: "torbox", kind: "debrid", api_key: "key", host: null,
      enabled: 1, priority: 10, config_json: "{}", premium_until: null,
      last_checked_at: null, last_error: null, created_at: 0,
    }];

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("torrentio.test")) {
        return jsonResponse({
          streams: [
            { infoHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", title: "Cached.4K.x265.mkv" },
            { infoHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", title: "Uncached.1080p.x264.mkv" },
          ],
        });
      }
      if (String(url).includes("checkcached")) {
        return jsonResponse({
          data: {
            aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: { name: "cached" },
            bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb: null,
          },
        });
      }
      throw new Error(`unexpected: ${url}`);
    }));

    const out = await syncNativeStreams({
      itemId: "item-2",
      query: { kind: "movie", imdbId: "tt2", title: "T" },
      prefs: { ...basePrefs, excludeUncached: true },
    });

    expect(out).toHaveLength(1);
    expect(out[0]!.cachedOnDebrid).toBe(true);
    expect(out[0]!.infoHash).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("deduplicates candidates that show up across multiple sources by infoHash", async () => {
    sourceRows = [
      {
        id: "src-tor", source_type: "torrentio", name: "Torrentio",
        url: "https://torrentio.test", api_key: null, enabled: 1, priority: 10,
        config_json: "{}", last_checked_at: null, last_error: null, created_at: 0,
      },
      {
        id: "src-zln", source_type: "zilean", name: "Zilean",
        url: "https://zilean.test", api_key: null, enabled: 1, priority: 20,
        config_json: "{}", last_checked_at: null, last_error: null, created_at: 0,
      },
    ];

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("torrentio.test")) {
        return jsonResponse({
          streams: [{ infoHash: "shared12345678901234567890123456789012345", title: "X 1080p" }],
        });
      }
      if (String(url).includes("zilean.test")) {
        // Same hash, different metadata. Should be deduped to one candidate.
        return jsonResponse([
          { info_hash: "shared12345678901234567890123456789012345", raw_title: "X 1080p", size: "2 GB" },
        ]);
      }
      throw new Error(`unexpected: ${url}`);
    }));

    const out = await syncNativeStreams({
      itemId: "item-3",
      query: { kind: "movie", imdbId: "tt3", title: "X" },
      prefs: basePrefs,
    });

    expect(out).toHaveLength(1);
  });
});
