import { describe, expect, it } from "vitest";

import { parsePropfindFiles, sanitiseJobLabel } from "./nzbdav";

describe("sanitiseJobLabel", () => {
  it("strips newlines, emoji and control chars from a formatted display label", () => {
    // This is the exact shape that 500'd NZBDav's entity save: a formatted
    // label leaked in as the nzbname (emoji + newlines).
    const label = "HEVC · 🌟 DV\n🌐\n📦 30.7 GB · 🏷️ FTP";
    const out = sanitiseJobLabel(label);
    expect(out).not.toMatch(/[\n\r]/);
    // No non-ASCII survives (emoji + the middot · are gone).
    expect(/[^\x20-\x7E]/.test(out)).toBe(false);
    expect(out).toContain("HEVC");
    expect(out).toContain("GB");
    expect(out).toContain("FTP");
  });

  it("preserves a normal release name verbatim (dots + dashes kept)", () => {
    const name = "Show.Name.S01E05.1080p.WEB-DL.x265-GRP";
    expect(sanitiseJobLabel(name)).toBe(name);
  });

  it("replaces path separators and clamps length", () => {
    expect(sanitiseJobLabel("a/b\\c")).toBe("a_b_c");
    expect(sanitiseJobLabel("x".repeat(500)).length).toBe(240);
  });

  it("falls back to a placeholder when nothing printable remains", () => {
    expect(sanitiseJobLabel("🌟🌐📦")).toBe("rewind-nzb");
    expect(sanitiseJobLabel("")).toBe("rewind-nzb");
  });
});

describe("parsePropfindFiles", () => {
  it("returns video files and skips collections + tiny aux files", () => {
    const xml = `<?xml version="1.0"?>
      <D:multistatus xmlns:D="DAV:">
        <D:response><D:href>/content/TV/Show/</D:href>
          <D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat>
        </D:response>
        <D:response><D:href>/content/TV/Show/Show.S01E05.mkv</D:href>
          <D:propstat><D:prop><D:getcontentlength>2000000000</D:getcontentlength></D:prop></D:propstat>
        </D:response>
        <D:response><D:href>/content/TV/Show/readme.nfo</D:href>
          <D:propstat><D:prop><D:getcontentlength>1024</D:getcontentlength></D:prop></D:propstat>
        </D:response>
      </D:multistatus>`;
    const files = parsePropfindFiles(xml, "http://host/content/TV/Show");
    expect(files.map((f) => f.name)).toEqual(["Show.S01E05.mkv"]);
  });
});
