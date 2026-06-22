import { describe, expect, it } from "vitest";

import { DEFAULT_FORMATTER_CONFIG, formatStream, parseFormatterConfig } from "./formatter";
import type { ResolvedStream } from "./types";

const baseStream: ResolvedStream = {
  id: "s1",
  sourceType: "comet",
  sourceId: "src1",
  name: "Stream",
  description: "",
  rawTitle: "FROM.S01E05.Pilot.1080p.WEB-DL.x265-FLUX.mkv",
  url: "https://example.com/stream.mkv",
  resolverId: "rd",
  cachedOnDebrid: true,
  releaseGroup: "FLUX",
  resolution: "1080p",
  codec: "h265",
  hdrFlags: 0,
  audioCodec: "truehd",
  audioChannels: "7.1",
  languages: ["en"],
  sourceTag: "WEB-DL",
  parsedTitle: "FROM",
  parsedYear: 2022,
  editions: [],
  seasons: [1],
  episodes: [5],
  seasonPack: false,
  bingeGroup: undefined,
  infoHash: "abc",
  nzbId: undefined,
  sizeBytes: 17 * 1024 ** 3,
  seeders: 245,
};

describe("formatter defaults", () => {
  it("includes episode context for TV streams", () => {
    const out = formatStream(baseStream, DEFAULT_FORMATTER_CONFIG, {
      addonName: "Comet",
      episodeName: "Silhouettes",
    });

    expect(out.title).toContain("1x05");
    expect(out.subtitle).toContain("Silhouettes");
  });

  it("migrates older configs that lacked season and episode blocks", () => {
    const migrated = parseFormatterConfig({
      title: {
        separator: " ",
        blocks: [
          { category: "cache", style: "emoji" },
          { category: "addon", style: "bracket" },
          { category: "resolution", style: "names" },
        ],
      },
      subtitle: [
        {
          separator: " · ",
          blocks: [{ category: "quality", style: "full" }],
        },
      ],
    });

    const out = formatStream(baseStream, migrated, {
      addonName: "Comet",
      episodeName: "Silhouettes",
    });

    expect(out.title).toContain("1x05");
    expect(out.subtitle).toContain("Silhouettes");
  });
});