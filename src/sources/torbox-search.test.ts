import { afterEach, describe, expect, it, vi } from "vitest";

import { TorBoxSearchSource } from "./torbox-search";
import type { StreamSourceRow } from "@forge/types";

function row(over: Partial<StreamSourceRow> = {}): StreamSourceRow {
  return {
    id: "src-tbs", source_type: "torbox-search", name: "TorBox search",
    url: null, api_key: "TB-KEY",
    enabled: 1, priority: 50, config_json: "{}",
    last_checked_at: null, last_error: null, created_at: 0,
    ...over,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TorBoxSearchSource", () => {
  it("emits both torrent (infoHash) and usenet (nzbId) candidates by default", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      data: {
        torrents: [
          {
            hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            raw_title: "Movie.2024.2160p.WEB-DL.x265-GRP",
            size: 7_000_000_000,
            last_known_seeders: 42,
            tracker: "rarbg",
          },
        ],
        nzbs: [
          {
            nzb: "https://example.test/foo.nzb",
            raw_title: "Movie.2024.2160p.WEB-DL.x265-GRP",
            size: 6_500_000_000,
          },
        ],
      },
    })));

    const src = new TorBoxSearchSource(row());
    const out = await src.search({ kind: "movie", imdbId: "tt1234567" });

    expect(out).toHaveLength(2);
    const tor = out.find((c) => c.infoHash);
    const nzb = out.find((c) => c.nzbId);
    expect(tor?.infoHash).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(tor?.seeders).toBe(42);
    expect(nzb?.nzbId).toBe("https://example.test/foo.nzb");
    expect(nzb?.sizeBytes).toBe(6_500_000_000);
  });

  it("authenticates via Bearer header and uses imdb prefix path", async () => {
    let capturedAuth: string | undefined;
    let capturedUrl = "";
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      const hdrs = init?.headers as Record<string, string> | undefined;
      capturedAuth = hdrs?.Authorization;
      return jsonResponse({ data: { torrents: [], nzbs: [] } });
    }));
    const src = new TorBoxSearchSource(row());
    await src.search({ kind: "movie", imdbId: "tt0111161" });
    expect(capturedAuth).toBe("Bearer TB-KEY");
    expect(capturedUrl).toContain("/torrents/imdb:tt0111161");
  });

  it("returns empty array when no api_key is set", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const src = new TorBoxSearchSource(row({ api_key: null }));
    const out = await src.search({ kind: "movie", imdbId: "tt0111161" });
    expect(out).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("respects searchKind config to filter results", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      data: {
        torrents: [{ hash: "aaa", raw_title: "x", size: 1 }],
        nzbs: [{ nzb: "https://x.test/n.nzb", raw_title: "y", size: 1 }],
      },
    })));

    const src = new TorBoxSearchSource(row({ config_json: '{"searchKind":"torrent"}' }));
    const out = await src.search({ kind: "movie", imdbId: "tt1" });
    expect(out).toHaveLength(1);
    expect(out[0]!.infoHash).toBeDefined();
    expect(out[0]!.nzbId).toBeUndefined();
  });
});
