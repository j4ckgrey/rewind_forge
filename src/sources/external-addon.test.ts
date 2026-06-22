import { afterEach, describe, expect, it, vi } from "vitest";

import { ExternalAddonSource } from "./external-addon";
import type { StreamSourceRow } from "@forge/types";

function row(url: string): StreamSourceRow {
  return {
    id: "src-ext", source_type: "external-addon", name: "My addon", url, api_key: null,
    enabled: 1, priority: 100, config_json: "{}",
    last_checked_at: null, last_error: null, created_at: 0,
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExternalAddonSource", () => {
  it("emits candidates for streams with `url` (direct HTTP)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      streams: [
        { url: "https://cdn.test/movie.mkv", title: "Movie 1080p", name: "AIOStreams · 1080p" },
      ],
    })));

    const src = new ExternalAddonSource(row("https://example.test/manifest.json"));
    const out = await src.search({ kind: "movie", imdbId: "tt0111161" });

    expect(out).toHaveLength(1);
    expect(out[0]!.url).toBe("https://cdn.test/movie.mkv");
    expect(out[0]!.infoHash).toBeUndefined();
    expect(out[0]!.rawTitle).toBe("Movie 1080p");
  });

  it("emits candidates for streams with `infoHash` (torrent-style addons)", async () => {
    // This was the bug: torrent-only external addons (Torrentio/Comet/MediaFusion)
    // returning infoHash-only streams used to be dropped. The pipeline now flows
    // them through the debrid resolvers downstream.
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      streams: [
        {
          infoHash: "ABCDEF0123456789ABCDEF0123456789ABCDEF01",
          fileIdx: 0,
          title: "Movie 2024 2160p HDR WEB-DL DV HEVC-NTb",
          name: "Comet · 4K",
          behaviorHints: { bingeGroup: "comet-4k-ntb" },
        },
      ],
    })));

    const src = new ExternalAddonSource(row("https://example.test/manifest.json"));
    const out = await src.search({ kind: "movie", imdbId: "tt1234567" });

    expect(out).toHaveLength(1);
    expect(out[0]!.url).toBeUndefined();
    expect(out[0]!.infoHash).toBe("abcdef0123456789abcdef0123456789abcdef01"); // lowercased
    expect(out[0]!.bingeGroup).toBe("comet-4k-ntb");
  });

  it("emits mixed url + infoHash results in one pass", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      streams: [
        { url: "https://cdn.test/file1.mkv", title: "Direct" },
        { infoHash: "abc123", title: "Torrent" },
      ],
    })));

    const src = new ExternalAddonSource(row("https://example.test/manifest.json"));
    const out = await src.search({ kind: "movie", imdbId: "tt0000001" });

    expect(out).toHaveLength(2);
    expect(out.find((c) => c.url)?.url).toBe("https://cdn.test/file1.mkv");
    expect(out.find((c) => c.infoHash)?.infoHash).toBe("abc123");
  });

  it("strips trailing /manifest.json before building stream URL", async () => {
    const fetchSpy = vi.fn(async () => jsonResponse({ streams: [] }));
    vi.stubGlobal("fetch", fetchSpy);
    const src = new ExternalAddonSource(row("https://example.test/foo/manifest.json"));
    await src.search({ kind: "movie", imdbId: "tt1" });
    expect(fetchSpy).toHaveBeenCalled();
    const url = (fetchSpy.mock.calls[0] as unknown[] | undefined)?.[0] as string;
    expect(url).toBe("https://example.test/foo/stream/movie/tt1.json");
  });

  it("builds series stream URL with season:episode", async () => {
    const fetchSpy = vi.fn(async () => jsonResponse({ streams: [] }));
    vi.stubGlobal("fetch", fetchSpy);
    const src = new ExternalAddonSource(row("https://example.test"));
    await src.search({ kind: "series", imdbId: "tt0903747", season: 5, episode: 14 });
    const url = (fetchSpy.mock.calls[0] as unknown[] | undefined)?.[0] as string;
    expect(url).toContain("/stream/series/");
    expect(url).toContain("tt0903747%3A5%3A14"); // ":" url-encoded
  });
});
