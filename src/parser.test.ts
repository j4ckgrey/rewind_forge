import { describe, expect, it } from "vitest";

import {
  HDR_FLAG_DV,
  HDR_FLAG_HDR10,
  HDR_FLAG_HDR10_PLUS,
} from "./types";
import { parseReleaseName, parseSeeders, parseSizeBytes } from "./parser";

describe("parseReleaseName", () => {
  it("extracts resolution / codec / hdr / audio / group from a 4K HDR remux", () => {
    const r = parseReleaseName("Dune.Part.Two.2024.2160p.UHD.BluRay.REMUX.HDR10.HEVC.TrueHD.Atmos-FraMeSToR.mkv");
    expect(r.resolution).toBe("2160p");
    expect(r.codec).toBe("h265");
    expect(r.sourceTag).toBe("Remux");
    expect(r.hdrFlags & HDR_FLAG_HDR10).toBe(HDR_FLAG_HDR10);
    expect(r.audioCodec).toBe("truehd");
    expect(r.audioChannels).toBe("Atmos");
    expect(r.releaseGroup).toBe("FraMeSToR");
  });

  it("recognises Dolby Vision separately from HDR10", () => {
    const r = parseReleaseName("Severance.S02E01.DV.HDR.WEB-DL.x265-NOSiViD.mkv");
    expect(r.hdrFlags & HDR_FLAG_DV).toBe(HDR_FLAG_DV);
    expect(r.hdrFlags & HDR_FLAG_HDR10).toBe(HDR_FLAG_HDR10);
    expect(r.sourceTag).toBe("WEB-DL");
    expect(r.releaseGroup).toBe("NOSiViD");
  });

  it("handles HDR10+ as its own flag (not just HDR10)", () => {
    const r = parseReleaseName("Movie.2024.2160p.HDR10+.WEB-DL.x265-GRP.mkv");
    // HDR10+ is its own flag; HDR10 alone should NOT be set when only "+" present.
    expect(r.hdrFlags & HDR_FLAG_HDR10_PLUS).toBe(HDR_FLAG_HDR10_PLUS);
  });

  it("returns unknown for un-tagged filenames", () => {
    const r = parseReleaseName("random.mkv");
    expect(r.resolution).toBe("unknown");
    expect(r.codec).toBeNull();
    expect(r.releaseGroup).toBeNull();
    expect(r.hdrFlags).toBe(0);
  });

  it("rejects format tokens posing as release groups", () => {
    // -RIP, -DL, -HDR are NOT release group tags.
    expect(parseReleaseName("Movie.2024.WEB-DL.mkv").releaseGroup).toBeNull();
    expect(parseReleaseName("Movie.2024.BluRay-RIP.mkv").releaseGroup).toBeNull();
  });

  it("picks up languages including multi/dual variants", () => {
    const r = parseReleaseName("Movie.2024.MULTi.FRENCH.ENGLISH.1080p.WEB.mkv");
    expect(r.languages).toContain("multi");
    expect(r.languages).toContain("fr");
    expect(r.languages).toContain("en");
  });
});

describe("parseSizeBytes", () => {
  it("parses GB / MB / GiB suffixes", () => {
    expect(parseSizeBytes("Size: 12.4 GB")).toBe(Math.round(12.4 * 1024 ** 3));
    expect(parseSizeBytes("700 MB")).toBe(700 * 1024 ** 2);
    expect(parseSizeBytes("1.5 GiB")).toBe(Math.round(1.5 * 1024 ** 3));
  });

  it("returns null when no size token", () => {
    expect(parseSizeBytes("nothing here")).toBeNull();
    expect(parseSizeBytes("")).toBeNull();
  });
});

describe("parseSeeders", () => {
  it("reads emoji-prefixed seeder counts", () => {
    expect(parseSeeders("Title 👤 245 🌐 RARBG")).toBe(245);
  });

  it("reads 'Seeders: N' labels", () => {
    expect(parseSeeders("Seeders: 17 / Peers: 4")).toBe(17);
  });

  it("returns null when no token present", () => {
    expect(parseSeeders("random text")).toBeNull();
  });
});
