import { afterEach, describe, expect, it, vi } from "vitest";

import { TorBoxResolver } from "./torbox";
import type { StreamCandidate } from "../types";
import type { StreamAccountRow } from "@forge/types";

// Build a fake StreamAccountRow for TorBox.
function row(over: Partial<StreamAccountRow> = {}): StreamAccountRow {
  return {
    id: "acc-tb",
    provider: "torbox",
    kind: "debrid",
    api_key: "TB-TEST-KEY",
    host: null,
    enabled: 1,
    priority: 10,
    config_json: "{}",
    premium_until: null,
    last_checked_at: null,
    last_error: null,
    created_at: 0,
    ...over,
  };
}

function torrentCandidate(over: Partial<StreamCandidate> = {}): StreamCandidate {
  return {
    id: "cand-1", sourceType: "torrentio", sourceId: "src", name: "n", description: "", rawTitle: "",
    infoHash: "abcdef0123456789",
    ...over,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TorBoxResolver.checkAvailability", () => {
  it("uses /torrents/checkcached and authenticates via Bearer header", async () => {
    const calls: string[] = [];
    const headers: Record<string, string> = {};
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(url);
      // Capture auth header from the first call.
      const hdrs = init?.headers as Record<string, string> | undefined;
      if (hdrs?.Authorization) headers.auth = hdrs.Authorization;
      return jsonResponse({
        data: {
          abcdef0123456789: { name: "ok", size: 1234 },
          deadbeefdeadbeef: null,
        },
      });
    }));

    const resolver = new TorBoxResolver(row());
    const map = await resolver.checkAvailability([
      torrentCandidate({ id: "a", infoHash: "abcdef0123456789" }),
      torrentCandidate({ id: "b", infoHash: "deadbeefdeadbeef" }),
    ]);

    expect(map.get("a")).toBe(true);
    expect(map.get("b")).toBe(false);
    expect(calls[0]).toContain("https://api.torbox.app/v1/api/torrents/checkcached");
    expect(calls[0]).toContain("hash=abcdef0123456789");
    expect(calls[0]).toContain("hash=deadbeefdeadbeef");
    expect(headers.auth).toBe("Bearer TB-TEST-KEY");
  });

  it("returns empty map when api_key is missing", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const resolver = new TorBoxResolver(row({ api_key: null }));
    const map = await resolver.checkAvailability([torrentCandidate()]);
    expect(map.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("TorBoxResolver.resolve (torrent)", () => {
  it("creates torrent, polls list, requests dl and returns the URL", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(url);
      if (url.includes("/torrents/createtorrent")) {
        return jsonResponse({ success: true, data: { torrent_id: 42 } });
      }
      if (url.includes("/torrents/mylist")) {
        return jsonResponse({
          data: {
            id: 42,
            download_state: "completed",
            files: [
              { id: 1, name: "sample.mkv", size: 1_000_000 },
              { id: 2, name: "movie.mkv", size: 5_000_000_000 }, // biggest
              { id: 3, name: "extras.mkv", size: 200_000 },
            ],
          },
        });
      }
      if (url.includes("/torrents/requestdl")) {
        return jsonResponse({ data: "https://cdn.torbox.app/movie.mkv?signed=true" });
      }
      return jsonResponse({}, 404);
    }));

    const resolver = new TorBoxResolver(row());
    const url = await resolver.resolve(torrentCandidate());

    expect(url).toBe("https://cdn.torbox.app/movie.mkv?signed=true");
    // requestdl URL must use the BIGGEST file id (2) and the api key as token.
    const requestDl = calls.find((c) => c.includes("requestdl"));
    expect(requestDl).toBeTruthy();
    expect(requestDl).toContain("file_id=2");
    expect(requestDl).toContain("torrent_id=42");
    expect(requestDl).toContain("token=TB-TEST-KEY");
  });

  it("returns null when torrent isn't ready after retries", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("createtorrent")) return jsonResponse({ data: { torrent_id: 99 } });
      if (url.includes("mylist")) return jsonResponse({ data: { id: 99, download_state: "downloading", files: [] } });
      return jsonResponse({});
    }));
    const resolver = new TorBoxResolver(row());
    const url = await resolver.resolve(torrentCandidate());
    expect(url).toBeNull();
  }, 20_000);
});

describe("TorBoxResolver.resolve (usenet via NZB)", () => {
  it("creates usenet download when candidate has nzbId instead of infoHash", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(url);
      if (url.includes("/usenet/createusenetdownload")) {
        return jsonResponse({ data: { usenet_id: 7 } });
      }
      if (url.includes("/usenet/mylist")) {
        return jsonResponse({
          data: { id: 7, files: [{ id: 9, name: "movie.mkv", size: 4_000_000_000 }] },
        });
      }
      if (url.includes("/usenet/requestdl")) {
        return jsonResponse({ data: "https://cdn.torbox.app/usenet/9.mkv" });
      }
      return jsonResponse({}, 404);
    }));

    const resolver = new TorBoxResolver(row());
    const url = await resolver.resolve({
      ...torrentCandidate(),
      infoHash: undefined,
      nzbId: "https://example.test/movie.nzb",
    });
    expect(url).toBe("https://cdn.torbox.app/usenet/9.mkv");
    // /usenet/requestdl call uses the new download's id (7) and the api token.
    const requestDl = calls.find((c) => c.includes("usenet/requestdl"));
    expect(requestDl).toContain("usenet_id=7");
    expect(requestDl).toContain("file_id=9");
  });

  it("declares 'usenet' as an accepted candidate kind", () => {
    const resolver = new TorBoxResolver(row());
    expect(resolver.accepts).toContain("torrent");
    expect(resolver.accepts).toContain("usenet");
  });
});
