import { describe, expect, it } from "vitest";

import { applyAvailabilityFilters, applyFilters, parseStreamPrefs } from "./filter";
import type { ParsedStreamCandidate, ResolvedStream, StreamPrefs } from "./types";

const basePrefs: StreamPrefs = {
  resolutions: ["2160p", "1080p", "720p", "480p", "unknown"],
  codecs: [],
  hdrAllowed: true,
  sizeMinMb: null,
  sizeMaxMb: null,
  languages: [],
  excludedLanguages: [],
  sortOrder: [],
  bingePinReleaseGroup: false,
  minSeeders: null,
  excludeUncached: false,
  bingeOnlySeasonPacks: false,
  bingeStrictReleaseGroup: false,
  bingePinScope: "season",
};

function candidate(over: Partial<ParsedStreamCandidate>): ParsedStreamCandidate {
  return {
    id: "x", sourceType: "torrentio", sourceId: "src", name: "n", description: "", rawTitle: "",
    releaseGroup: null, resolution: "1080p", codec: "h264", hdrFlags: 0,
    audioCodec: null, audioChannels: null, languages: [], sourceTag: null,
    parsedTitle: null, parsedYear: null, editions: [],
    seasons: [], episodes: [], seasonPack: false,
    ...over,
  };
}

function resolved(over: Partial<ResolvedStream>): ResolvedStream {
  return {
    ...candidate({}),
    url: "https://example.test/file.mkv",
    resolverId: "acc-rd",
    cachedOnDebrid: false,
    ...over,
  };
}

describe("applyFilters (content stage)", () => {
  it("keeps everything with default prefs", () => {
    const list = [candidate({ resolution: "1080p" }), candidate({ resolution: "unknown" })];
    expect(applyFilters(list, basePrefs)).toHaveLength(2);
  });

  it("drops resolutions not on the allowlist", () => {
    const prefs = { ...basePrefs, resolutions: ["2160p" as const] };
    const list = [candidate({ resolution: "2160p" }), candidate({ resolution: "1080p" })];
    expect(applyFilters(list, prefs).map(c => c.resolution)).toEqual(["2160p"]);
  });

  it("rejects unknown codec when codec list is non-empty", () => {
    const prefs = { ...basePrefs, codecs: ["h265" as const] };
    const list = [candidate({ codec: "h265" }), candidate({ codec: "h264" }), candidate({ codec: null })];
    expect(applyFilters(list, prefs).map(c => c.codec)).toEqual(["h265"]);
  });

  it("drops HDR when hdrAllowed is false", () => {
    const prefs = { ...basePrefs, hdrAllowed: false };
    const list = [candidate({ hdrFlags: 1 }), candidate({ hdrFlags: 0 })];
    expect(applyFilters(list, prefs)).toHaveLength(1);
    expect(applyFilters(list, prefs)[0]!.hdrFlags).toBe(0);
  });

  it("respects size bounds (skips when size unknown)", () => {
    const prefs = { ...basePrefs, sizeMinMb: 1000, sizeMaxMb: 5000 };
    const list = [
      candidate({ sizeBytes: 500 * 1024 ** 2 }),     // 500 MB — below min
      candidate({ sizeBytes: 3000 * 1024 ** 2 }),    // 3 GB — in range
      candidate({ sizeBytes: 8000 * 1024 ** 2 }),    // 8 GB — above max
      candidate({ sizeBytes: undefined }),           // unknown — passes
    ];
    expect(applyFilters(list, prefs)).toHaveLength(2);
  });

  it("seeders threshold applies only when count known", () => {
    const prefs = { ...basePrefs, minSeeders: 10 };
    const list = [
      candidate({ seeders: 100 }),
      candidate({ seeders: 5 }),
      candidate({ seeders: undefined }), // unknown — passes
    ];
    expect(applyFilters(list, prefs)).toHaveLength(2);
  });

  describe("language include filter", () => {
    it("keeps only tagged matches and untagged releases", () => {
      const prefs = { ...basePrefs, languages: ["en"] };
      const list = [
        candidate({ languages: ["en"] }),        // match
        candidate({ languages: ["fr"] }),        // no match — dropped
        candidate({ languages: ["en", "fr"] }),  // partial match — kept
        candidate({ languages: [] }),            // untagged — kept
      ];
      expect(applyFilters(list, prefs).map(c => c.languages)).toEqual([
        ["en"], ["en", "fr"], [],
      ]);
    });
  });

  describe("language exclude filter", () => {
    it("drops a release only when every language is excluded", () => {
      const prefs = { ...basePrefs, excludedLanguages: ["ru"] };
      const list = [
        candidate({ languages: ["ru"] }),        // all excluded — dropped
        candidate({ languages: ["en", "ru"] }),  // en survives — kept
        candidate({ languages: ["en"] }),        // unaffected — kept
        candidate({ languages: [] }),            // untagged — kept
      ];
      expect(applyFilters(list, prefs).map(c => c.languages)).toEqual([
        ["en", "ru"], ["en"], [],
      ]);
    });

    it("include and exclude compose", () => {
      const prefs = { ...basePrefs, languages: ["en"], excludedLanguages: ["ru"] };
      const list = [
        candidate({ languages: ["en"] }),        // include hit, not excluded — kept
        candidate({ languages: ["ru"] }),        // include miss — dropped
        candidate({ languages: ["en", "ru"] }),  // include hit, ru not all-excluded — kept
      ];
      expect(applyFilters(list, prefs)).toHaveLength(2);
    });
  });
});

describe("applyAvailabilityFilters (cached-only)", () => {
  it("is a no-op when excludeUncached is false", () => {
    const list = [resolved({ cachedOnDebrid: false }), resolved({ cachedOnDebrid: true })];
    expect(applyAvailabilityFilters(list, basePrefs)).toHaveLength(2);
  });

  it("drops uncached when excludeUncached is true", () => {
    const prefs = { ...basePrefs, excludeUncached: true };
    const list = [
      resolved({ id: "a", cachedOnDebrid: false }),
      resolved({ id: "b", cachedOnDebrid: true }),
    ];
    expect(applyAvailabilityFilters(list, prefs).map(r => r.id)).toEqual(["b"]);
  });
});

describe("parseStreamPrefs", () => {
  it("hydrates JSON columns and bool flags", () => {
    const prefs = parseStreamPrefs({
      resolutions_json: '["1080p","720p"]',
      codecs_json: '["h264"]',
      hdr_allowed: 0,
      size_min_mb: 500,
      size_max_mb: null,
      languages_json: '["en"]',
      excluded_languages_json: '["ru","ar"]',
      sort_order_json: '["resolution","seeders"]',
      binge_pin_release_group: 1,
      min_seeders: 5,
      exclude_uncached: 1,
    });
    expect(prefs.resolutions).toEqual(["1080p", "720p"]);
    expect(prefs.hdrAllowed).toBe(false);
    expect(prefs.bingePinReleaseGroup).toBe(true);
    expect(prefs.excludeUncached).toBe(true);
    expect(prefs.minSeeders).toBe(5);
    expect(prefs.languages).toEqual(["en"]);
    expect(prefs.excludedLanguages).toEqual(["ru", "ar"]);
  });

  it("defaults excludedLanguages to [] when the column is absent (legacy row)", () => {
    const prefs = parseStreamPrefs({
      resolutions_json: "[]",
      codecs_json: "[]",
      hdr_allowed: 1,
      size_min_mb: null,
      size_max_mb: null,
      languages_json: "[]",
      sort_order_json: "[]",
      binge_pin_release_group: 0,
      min_seeders: null,
      exclude_uncached: 0,
    });
    expect(prefs.excludedLanguages).toEqual([]);
  });

  it("falls back to defaults on malformed JSON", () => {
    const prefs = parseStreamPrefs({
      resolutions_json: "garbage",
      codecs_json: "{",
      hdr_allowed: 1,
      size_min_mb: null,
      size_max_mb: null,
      languages_json: "",
      sort_order_json: "",
      binge_pin_release_group: 0,
      min_seeders: null,
      exclude_uncached: 0,
    });
    expect(prefs.resolutions).toEqual([]);
    expect(prefs.codecs).toEqual([]);
    expect(prefs.sortOrder).toEqual(["resolution", "cached", "seeders", "size"]);
  });
});
