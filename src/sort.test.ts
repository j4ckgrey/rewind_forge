import { describe, expect, it } from "vitest";

import { pinReleaseGroup, sortStreams } from "./sort";
import type { ResolvedStream, StreamPrefs } from "./types";

const basePrefs: StreamPrefs = {
  resolutions: [], codecs: [], hdrAllowed: true, sizeMinMb: null, sizeMaxMb: null,
  languages: [], excludedLanguages: [], sortOrder: [], bingePinReleaseGroup: false, minSeeders: null,
  excludeUncached: false, bingeOnlySeasonPacks: false, bingeStrictReleaseGroup: false,
  bingePinScope: "season",
};

function s(over: Partial<ResolvedStream>): ResolvedStream {
  return {
    id: "x", sourceType: "torrentio", sourceId: "src", name: "n", description: "", rawTitle: "",
    releaseGroup: null, resolution: "unknown", codec: null, hdrFlags: 0,
    audioCodec: null, audioChannels: null, languages: [], sourceTag: null,
    parsedTitle: null, parsedYear: null, editions: [],
    seasons: [], episodes: [], seasonPack: false,
    url: "u", resolverId: null, cachedOnDebrid: false, ...over,
  };
}

describe("sortStreams", () => {
  it("returns input unchanged when sortOrder is empty", () => {
    const list = [s({ id: "a", seeders: 5 }), s({ id: "b", seeders: 100 })];
    expect(sortStreams(list, basePrefs).map(x => x.id)).toEqual(["a", "b"]);
  });

  it("sorts by resolution descending (4K > 1080p > 720p)", () => {
    const prefs = { ...basePrefs, sortOrder: ["resolution" as const] };
    const list = [
      s({ id: "sd", resolution: "480p" }),
      s({ id: "uhd", resolution: "2160p" }),
      s({ id: "hd", resolution: "1080p" }),
    ];
    expect(sortStreams(list, prefs).map(x => x.id)).toEqual(["uhd", "hd", "sd"]);
  });

  it("composes resolution + cached + seeders in that order", () => {
    const prefs: StreamPrefs = { ...basePrefs, sortOrder: ["resolution", "cached", "seeders"] };
    const list = [
      s({ id: "1080-cached-5", resolution: "1080p", cachedOnDebrid: true, seeders: 5 }),
      s({ id: "1080-uncached-100", resolution: "1080p", cachedOnDebrid: false, seeders: 100 }),
      s({ id: "4k-uncached-50", resolution: "2160p", cachedOnDebrid: false, seeders: 50 }),
    ];
    // 4K wins on resolution → 1080p cached wins (cached>uncached) → 1080p uncached last.
    expect(sortStreams(list, prefs).map(x => x.id)).toEqual([
      "4k-uncached-50",
      "1080-cached-5",
      "1080-uncached-100",
    ]);
  });

  it("treats unknown seeders as worst (-1) so they sort last", () => {
    const prefs = { ...basePrefs, sortOrder: ["seeders" as const] };
    const list = [
      s({ id: "a", seeders: 0 }),
      s({ id: "b", seeders: undefined }),
      s({ id: "c", seeders: 10 }),
    ];
    expect(sortStreams(list, prefs).map(x => x.id)).toEqual(["c", "a", "b"]);
  });
});

describe("pinReleaseGroup", () => {
  it("lifts matching release group to the top, case-insensitively", () => {
    const list = [
      s({ id: "a", releaseGroup: "NTb" }),
      s({ id: "b", releaseGroup: "FraMeSToR" }),
      s({ id: "c", releaseGroup: "ntb" }),
    ];
    const out = pinReleaseGroup(list, "NTB");
    expect(out.map(x => x.id)).toEqual(["a", "c", "b"]);
  });

  it("no-ops on null preferred group", () => {
    const list = [s({ id: "a", releaseGroup: "X" })];
    expect(pinReleaseGroup(list, null)).toEqual(list);
  });

  it("preserves original order among non-matches", () => {
    const list = [
      s({ id: "a", releaseGroup: "A" }),
      s({ id: "b", releaseGroup: "B" }),
      s({ id: "c", releaseGroup: null }),
    ];
    expect(pinReleaseGroup(list, "B").map(x => x.id)).toEqual(["b", "a", "c"]);
  });
});
