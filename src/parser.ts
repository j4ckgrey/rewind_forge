/**
 * Release-name parser.
 *
 * Wraps `@viren070/parse-torrent-title` (same library AIOStreams uses) for
 * the heavy lifting — Cyrillic / Italian / Polish / Russian release names,
 * COMPLETE keyword detection, season ranges, anime absolute numbering,
 * comprehensive resolution / codec / audio / language detection. A thin
 * mapping layer below normalises its output into our internal types so
 * downstream consumers (filter, sort, pipeline, picker label) don't have
 * to know about the library shape.
 *
 * The earlier hand-rolled regex parser is preserved as `parseSeasonEpisode`
 * for a small set of unit tests; production paths go through the wrapper.
 */
import { Parser, handlers } from "@viren070/parse-torrent-title";

import {
  HDR_FLAG_DV,
  HDR_FLAG_HDR10,
  HDR_FLAG_HDR10_PLUS,
  HDR_FLAG_HLG,
  type AudioCodec,
  type ParsedStreamCandidate,
  type Resolution,
  type SourceTag,
  type StreamCandidate,
  type VideoCodec,
} from "./types";

// Single shared parser instance — building the handler chain every call is
// wasteful and the library is stateless.
const ptt = new Parser().addHandlers(handlers);

const RESOLUTION_PATTERNS: Array<[RegExp, Resolution]> = [
  [/\b(?:2160p|4k|uhd)\b/i, "2160p"],
  [/\b(?:1080p|fhd)\b/i, "1080p"],
  [/\b(?:720p|hd)\b/i, "720p"],
  [/\b(?:480p|576p|sd)\b/i, "480p"],
];

const VIDEO_CODEC_PATTERNS: Array<[RegExp, VideoCodec]> = [
  [/\b(?:x265|h\.?265|hevc)\b/i, "h265"],
  [/\b(?:x264|h\.?264|avc)\b/i, "h264"],
  [/\bav1\b/i, "av1"],
  [/\bvp9\b/i, "vp9"],
  [/\b(?:mpeg-?2|mpeg2)\b/i, "mpeg2"],
];

const SOURCE_PATTERNS: Array<[RegExp, SourceTag]> = [
  [/\bremux\b/i, "Remux"],
  [/\b(?:bluray|blu-ray|bdrip|brrip|bd)\b/i, "BluRay"],
  [/\bweb-?dl\b/i, "WEB-DL"],
  [/\bweb-?rip\b/i, "WEBRip"],
  [/\bhdtv\b/i, "HDTV"],
  [/\b(?:dvdrip|dvd)\b/i, "DVDRip"],
  [/\b(?:cam|hdcam|camrip)\b/i, "CAM"],
  [/\b(?:ts|telesync|hdts)\b/i, "TS"],
];

const AUDIO_CODEC_PATTERNS: Array<[RegExp, AudioCodec]> = [
  [/\b(?:atmos|truehd)\b/i, "truehd"],
  [/\bdts-?hd(?:[. ]?ma)?\b/i, "dts-hd"],
  [/\bdts\b/i, "dts"],
  [/\b(?:eac-?3|ddp|dd\+|e-ac-?3)\b/i, "eac3"],
  [/\b(?:ac-?3|dd5\.1|dolby ?digital)\b/i, "ac3"],
  [/\bflac\b/i, "flac"],
  [/\baac\b/i, "aac"],
  [/\bopus\b/i, "opus"],
  [/\bmp3\b/i, "mp3"],
];

const CHANNEL_PATTERNS: Array<[RegExp, string]> = [
  [/\batmos\b/i, "Atmos"],
  [/\b7\.1\b/, "7.1"],
  [/\b6\.1\b/, "6.1"],
  [/\b5\.1\b/, "5.1"],
  [/\b2\.0\b/, "2.0"],
];

// Languages are matched on three-letter codes, two-letter codes, and a small
// set of common spelled-out forms. Anything outside this set falls through to
// no language tag rather than guessing.
const LANGUAGE_PATTERNS: Array<[RegExp, string]> = [
  [/\b(?:english|eng)\b/i, "en"],
  [/\b(?:spanish|spa|esp)\b/i, "es"],
  [/\b(?:french|fre|fra)\b/i, "fr"],
  [/\b(?:german|ger|deu)\b/i, "de"],
  [/\b(?:italian|ita)\b/i, "it"],
  [/\b(?:portuguese|por|pob|ptbr)\b/i, "pt"],
  [/\b(?:russian|rus)\b/i, "ru"],
  [/\b(?:japanese|jpn)\b/i, "ja"],
  [/\b(?:korean|kor)\b/i, "ko"],
  [/\b(?:chinese|chs|cht|chi|zho|mandarin)\b/i, "zh"],
  [/\b(?:hindi|hin)\b/i, "hi"],
  [/\b(?:arabic|ara)\b/i, "ar"],
  [/\bmulti\b/i, "multi"],
  [/\b(?:dual|dub)\b/i, "dual"],
];

function detectHdrFlags(title: string): number {
  let flags = 0;
  if (/\bhdr10\+/i.test(title)) flags |= HDR_FLAG_HDR10_PLUS;
  else if (/\bhdr(?:10)?\b/i.test(title)) flags |= HDR_FLAG_HDR10;
  if (/\b(?:dv|dolby ?vision|dovi)\b/i.test(title)) flags |= HDR_FLAG_DV;
  if (/\bhlg\b/i.test(title)) flags |= HDR_FLAG_HLG;
  return flags;
}

function matchFirst<T>(title: string, table: ReadonlyArray<readonly [RegExp, T]>): T | null {
  for (const [pattern, value] of table) {
    if (pattern.test(title)) return value;
  }
  return null;
}

/**
 * Pulls the release group from the end of a filename ("...HDR.x265-RARBG"
 * → "RARBG"). Returns null when no group tag is present.
 *
 * Heuristic: last `-` followed by 2–20 ASCII chars before the extension.
 * Skips when the trailing token contains spaces or starts with a digit
 * (those are nearly always part of a title, not a group tag).
 */
function extractReleaseGroup(title: string): string | null {
  const cleaned = title.replace(/\.(mkv|mp4|avi|m4v|ts|webm)$/i, "");
  const match = cleaned.match(/-([A-Za-z][A-Za-z0-9_.]{1,19})$/);
  if (!match) return null;
  const group = match[1]!;
  // Reject common non-group trailing tokens (e.g. "WEB-DL", "BluRay-1080p")
  if (/^(?:WEB|DL|RIP|BluRay|HDR|DV|AAC|AC3|EAC3|DTS|TrueHD|x265|x264|h265|h264|HEVC|AVC)$/i.test(group)) {
    return null;
  }
  return group;
}

/**
 * Pull season + episode numbers out of a release / file name. Designed to
 * cover the bulk of scene/p2p naming conventions:
 *
 *   - "Show.S01E05.1080p.WEB.x265" → seasons=[1], episodes=[5]
 *   - "Show.S01E05-E07" / "S01E05E06E07" → seasons=[1], episodes=[5,6,7]
 *   - "Show.S01.Complete" / "Show.Season.1" → seasons=[1], episodes=[]
 *   - "Show.S01-S03"      → seasons=[1,2,3], episodes=[]
 *   - "Show.1x05"         → seasons=[1], episodes=[5]
 *   - "Show.E05"          → seasons=[], episodes=[5]     (anime / un-seasoned)
 *   - "Show - 05"         → seasons=[], episodes=[5]     (anime "absolute")
 *
 * Both arrays are unique + sorted ascending. Empty arrays mean "couldn't
 * detect" — the filter treats that as "could match anything" so we don't
 * over-reject when an addon ships a sparsely-named file.
 *
 * A `seasonPack` flag is returned for the common "seasons present, no
 * episodes" pattern — the filter uses it to allow a season pack through
 * even when the requested episode isn't named in the file, since the
 * resolver will pick the right file out of the pack later.
 */
function uniqueSortedInts(xs: number[]): number[] {
  return Array.from(new Set(xs.filter((n) => Number.isFinite(n) && n > 0))).sort((a, b) => a - b);
}

// Foreign-language equivalents of "Season". Real-world Torrentio results
// carry these because indexers ingest releases from non-English trackers.
// Without recognising them, a pack from RuTracker / RuTor / TheMovieFiles
// (Russian), or PIR8 / ILCorsaroNero (Italian), or NyaaTorrents anime fan
// translations, sneaks past the pack-detection unlabelled.
//
//   en: season           → already covered by the Latin "season|s" regex
//   ru: СЕЗОН            (Cyrillic)
//   es/pt: temporada
//   it: stagione
//   pl: sezon
//   fr: saison
//   de: staffel
//   tr: sezon            (same as pl)
const SEASON_WORD = "(?:season|сезон|temporada|stagione|sezon|saison|staffel)";
// Episode words for the "СЕРИИ: 1-10 ИЗ 10" / "EPISODIO 5" patterns.
const EPISODE_WORD = "(?:episode|episodio|episódio|серии|серия|odcinek|folge|épisode|capítulo|capitulo)";

/**
 * Lightweight wrapper that pulls just the season/episode/pack info out
 * of the full release-name parse. Used by the resolver file-picker
 * (per-file in a debrid pack) where the full parse would be wasteful.
 */
export function parseSeasonEpisodeLib(rawTitle: string): {
  seasons: number[];
  episodes: number[];
  seasonPack: boolean;
} {
  const p = parseReleaseName(rawTitle);
  return { seasons: p.seasons, episodes: p.episodes, seasonPack: p.seasonPack };
}

/**
 * @deprecated Legacy hand-rolled implementation. Kept for the existing
 * unit tests and the resolver file-picker default. New code should call
 * `parseSeasonEpisodeLib` (or `parseReleaseName`) which uses the
 * `@viren070/parse-torrent-title` library and handles Cyrillic, Italian,
 * Polish, etc. correctly.
 */
export function parseSeasonEpisode(rawTitle: string): {
  seasons: number[];
  episodes: number[];
  seasonPack: boolean;
} {
  // Indexer descriptions often glue size/seeders onto the release name with
  // a newline ("Movie.S01E01.mkv\nSize: 4.5 GB\n👤 245") AND the
  // debrid-extracted filename arrives on its own line ("FROM TEMPORADA
  // 1/FROM ... S01E01.MKV"). Parse EVERY non-metadata line and union the
  // S/E results — without this we'd see only the top "FROM.COMPLETE.…"
  // line, miss "S01E01" in the filename, and label correctly as a pack
  // but never deduce which episode was inside.
  const usefulLines = (rawTitle ?? "").split(/[\r\n]/).filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^(?:size|seed(?:ers?)?|peers?):/i.test(trimmed)) return false;
    if (/^[\p{Extended_Pictographic}]/u.test(trimmed)) return false;
    return true;
  });
  if (usefulLines.length === 0) {
    return { seasons: [], episodes: [], seasonPack: false };
  }
  const seasons: number[] = [];
  const episodes: number[] = [];

  for (const title of usefulLines) {
  // Range: SxxEyy-EzzEww (and SxxEyyEzzEww). The episodes-list parser below
  // extracts every Ezz token, then we expand any "-" range it ate.
  for (const m of title.matchAll(/\bS(\d{1,3})((?:[ ._-]?E\d{1,3})+(?:[ ._-]?-[ ._-]?E?\d{1,3})?)/gi)) {
    seasons.push(parseInt(m[1]!, 10));
    const epPart = m[2] ?? "";
    const eps: number[] = [];
    for (const em of epPart.matchAll(/E?(\d{1,3})/gi)) {
      const n = parseInt(em[1]!, 10);
      if (!Number.isNaN(n)) eps.push(n);
    }
    // Detect a single range "Eaa-Ebb" and expand it. The full match is the
    // captured trailing range in epPart.
    const rangeMatch = epPart.match(/E?(\d{1,3})[ ._-]?-[ ._-]?E?(\d{1,3})/i);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1]!, 10);
      const b = parseInt(rangeMatch[2]!, 10);
      if (Number.isFinite(a) && Number.isFinite(b) && a <= b && b - a <= 30) {
        for (let v = a; v <= b; v++) eps.push(v);
      }
    }
    episodes.push(...eps);
  }

  // Season-range: S01-S03 or Season 1-3
  for (const m of title.matchAll(/\bS(\d{1,2})[ ._-]?-[ ._-]?S?(\d{1,2})\b/gi)) {
    const a = parseInt(m[1]!, 10);
    const b = parseInt(m[2]!, 10);
    if (a <= b && b - a <= 20) for (let v = a; v <= b; v++) seasons.push(v);
  }
  // Multilingual "Season 1-3" / "TEMPORADA 1-3" / "STAGIONE 01-03" / "СЕЗОН 1-2" etc.
  {
    const re = new RegExp(`\\b${SEASON_WORD}s?[ ._:-]?(\\d{1,2})[ ._-]?(?:-|to|–)[ ._-]?(\\d{1,2})\\b`, "giu");
    for (const m of title.matchAll(re)) {
      const a = parseInt(m[1]!, 10);
      const b = parseInt(m[2]!, 10);
      if (a <= b && b - a <= 20) for (let v = a; v <= b; v++) seasons.push(v);
    }
  }

  // Single "Season N" / "Complete S01" / standalone "S01"
  for (const m of title.matchAll(/\b(?:season|s)[ ._-]?(\d{1,2})\b(?!\d)(?!.*?E\d)/gi)) {
    seasons.push(parseInt(m[1]!, 10));
  }
  // Multilingual "СЕЗОН: 1" / "TEMPORADA 1" / "STAGIONE 01" / "SEZON 01" etc.
  {
    const re = new RegExp(`\\b${SEASON_WORD}s?[ ._:-]?(\\d{1,2})\\b`, "giu");
    for (const m of title.matchAll(re)) {
      seasons.push(parseInt(m[1]!, 10));
    }
  }

  // "1x05" pattern (also covers "01x01" / "1X01")
  for (const m of title.matchAll(/\b(\d{1,2})x(\d{1,3})\b/gi)) {
    seasons.push(parseInt(m[1]!, 10));
    episodes.push(parseInt(m[2]!, 10));
  }

  // Multilingual "СЕРИИ: 1-10" / "EPISODIO 5" / "Episodes 1-10" — episode
  // ranges or singles introduced by a foreign episode keyword.
  {
    const re = new RegExp(`\\b${EPISODE_WORD}s?[ ._:-]?(\\d{1,3})(?:[ ._-]?(?:-|to|–|из|of)[ ._-]?(\\d{1,3}))?`, "giu");
    for (const m of title.matchAll(re)) {
      const a = parseInt(m[1]!, 10);
      const b = m[2] ? parseInt(m[2], 10) : null;
      if (b != null && Number.isFinite(a) && Number.isFinite(b) && a <= b && b - a <= 50) {
        for (let v = a; v <= b; v++) episodes.push(v);
      } else if (Number.isFinite(a)) {
        episodes.push(a);
      }
    }
  }

  // Solo "E05" or "Episode 5" (no season context) — anime/unseasoned releases.
  if (seasons.length === 0) {
    for (const m of title.matchAll(/\bE(?:p|pisode)?[ ._-]?(\d{1,3})\b/gi)) {
      episodes.push(parseInt(m[1]!, 10));
    }
  }

  // Anime-style " - 05 " absolute number. Last-resort only — requires a
  // literal "- " prefix so we don't pick up year ("Show.2024"), resolution
  // ("1080p"), or random size/seeder digits. This shape covers the common
  // anime release naming "[Group] Show - 05 [1080p].mkv" without grabbing
  // unrelated numbers from the rest of the filename.
  if (seasons.length === 0 && episodes.length === 0) {
    const abs = title.match(/(?:^|[\s\]])-\s(\d{1,3})(?=[\s\[(.]|$)/);
    if (abs) {
      const n = parseInt(abs[1]!, 10);
      if (Number.isFinite(n) && n >= 1 && n <= 999) episodes.push(n);
    }
  }
  } // end per-line loop

  const uniqSeasons = uniqueSortedInts(seasons);
  const uniqEpisodes = uniqueSortedInts(episodes);

  // Keyword-based pack hint. Even when the parser can't pull a season
  // number out of the title (e.g. "FROM.2022.2023.COMPLETE.1080P"), a
  // "complete" / "completa" / "полная" token strongly signals a pack —
  // and our gate should keep these so the resolver can pick the right
  // file from inside.
  const completeHint = /\b(?:complete|completa|completo|complet|komplett|полная|полный|complète)\b/iu
    .test(usefulLines.join(" "));

  // Pack detection: explicit "S01 Complete" / "Season 1" naming with no
  // specific episode, a multi-episode range (>5 episodes, batch), a
  // multi-season title ("S01-S03 / STAGIONE 01-03"), or the COMPLETE
  // keyword hint without any specific S/E parse.
  const seasonPack =
    (uniqSeasons.length > 0 && uniqEpisodes.length === 0) ||
    uniqEpisodes.length > 5 ||
    uniqSeasons.length > 1 ||
    (completeHint && uniqEpisodes.length === 0);
  return { seasons: uniqSeasons, episodes: uniqEpisodes, seasonPack };
}

// ── library → internal-type mapping helpers ────────────────────────────

function mapResolution(raw: string | undefined): Resolution {
  if (!raw) return "unknown";
  const v = raw.toLowerCase();
  if (v === "4k" || v === "2160p" || v === "uhd") return "2160p";
  if (v === "1080p" || v === "fhd") return "1080p";
  if (v === "720p" || v === "hd") return "720p";
  if (v === "480p" || v === "576p" || v === "sd") return "480p";
  return "unknown";
}

function mapCodec(raw: string | undefined): VideoCodec | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === "hevc" || v === "h265" || v === "x265") return "h265";
  if (v === "avc" || v === "h264" || v === "x264") return "h264";
  if (v === "av1") return "av1";
  if (v === "vp9") return "vp9";
  if (v === "mpeg2" || v === "mpeg-2") return "mpeg2";
  return null;
}

function mapSourceTag(raw: string | undefined): SourceTag | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  // Compound qualities like "BluRay REMUX" — match the more specific tag.
  // Remux wins over BluRay because Radarr/Sonarr also prefer it.
  if (/\bremux\b/.test(v)) return "Remux";
  if (/\bblu-?ray\b|\bbdrip\b|\bbrrip\b|\bbd\b/.test(v)) return "BluRay";
  if (/\bweb[-. ]?dl\b/.test(v)) return "WEB-DL";
  if (/\bweb[-. ]?rip\b/.test(v)) return "WEBRip";
  if (/\bhdtv\b/.test(v)) return "HDTV";
  if (/\bdvdrip\b|\bdvd\b/.test(v)) return "DVDRip";
  if (/\bcam\b|\bhdcam\b|\bcamrip\b/.test(v)) return "CAM";
  if (/\bts\b|\btelesync\b|\bhdts\b/.test(v)) return "TS";
  return null;
}

function mapAudioCodec(raw: string | undefined): AudioCodec | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === "truehd" || v === "atmos") return "truehd";
  if (v === "dtshd" || v === "dts-hd" || v === "dts hd ma") return "dts-hd";
  if (v === "dts") return "dts";
  if (v === "eac3" || v === "ddp" || v === "dd+" || v === "e-ac3" || v === "eac-3") return "eac3";
  if (v === "ac3" || v === "dd" || v === "dolby digital") return "ac3";
  if (v === "flac") return "flac";
  if (v === "aac") return "aac";
  if (v === "opus") return "opus";
  if (v === "mp3") return "mp3";
  return null;
}

function mapHdrFlags(hdr: string[] | undefined): number {
  if (!hdr || hdr.length === 0) return 0;
  let flags = 0;
  for (const v of hdr) {
    const k = v.toLowerCase();
    if (k.includes("hdr10+")) flags |= HDR_FLAG_HDR10_PLUS;
    else if (k.includes("hdr")) flags |= HDR_FLAG_HDR10;
    if (k === "dv" || k.includes("dolby vision") || k.includes("dovi")) flags |= HDR_FLAG_DV;
    if (k === "hlg") flags |= HDR_FLAG_HLG;
  }
  return flags;
}

type PttResult = {
  title?: string;
  year?: string;
  resolution?: string;
  codec?: string;
  quality?: string;
  source?: string;
  hdr?: string[];
  audio?: string[];
  audiochannels?: string[];
  channels?: string[];
  group?: string;
  encoder?: string;
  languages?: string[];
  language?: string;
  seasons?: number[];
  episodes?: number[];
  complete?: boolean;
  editions?: string[];
  extended?: boolean;
};

export function parseReleaseName(rawTitle: string): {
  releaseGroup: string | null;
  resolution: Resolution;
  codec: VideoCodec | null;
  hdrFlags: number;
  audioCodec: AudioCodec | null;
  audioChannels: string | null;
  languages: string[];
  sourceTag: SourceTag | null;
  parsedTitle: string | null;
  parsedYear: number | null;
  editions: string[];
  seasons: number[];
  episodes: number[];
  seasonPack: boolean;
} {
  // Indexer descriptions often glue size/seeders onto the release name with
  // newlines and the debrid-extracted filename arrives on its own line.
  // PTT works best on a clean per-line input; we parse every useful line and
  // merge. Drop "Size:", "Seed:", and emoji-led metadata lines so trailing
  // numbers don't get mistaken for episode numbers.
  const lines = (rawTitle ?? "").split(/[\r\n]/).filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^(?:size|seed(?:ers?)?|peers?):/i.test(trimmed)) return false;
    if (/^[\p{Extended_Pictographic}]/u.test(trimmed)) return false;
    return true;
  });

  const merged: PttResult = {};
  for (const line of lines) {
    const r = ptt.parse(line) as PttResult;
    // Take the first non-empty value across lines so the release name's
    // resolution / quality / etc. don't get clobbered by a sparser
    // filename, but missing fields can be filled in from the filename.
    if (!merged.title && r.title) merged.title = r.title;
    if (!merged.year && r.year) merged.year = r.year;
    if (!merged.resolution && r.resolution) merged.resolution = r.resolution;
    if (!merged.codec && r.codec) merged.codec = r.codec;
    if (!merged.quality && (r.quality || r.source)) merged.quality = r.quality ?? r.source;
    if (!merged.group && (r.group || r.encoder)) merged.group = r.group ?? r.encoder;
    if (!merged.hdr && r.hdr) merged.hdr = r.hdr;
    if (!merged.audio && r.audio) merged.audio = r.audio;
    if (!merged.audiochannels && (r.audiochannels || r.channels)) merged.audiochannels = r.audiochannels ?? r.channels;
    if (!merged.languages && (r.languages || r.language)) {
      merged.languages = r.languages ?? (r.language ? [r.language] : undefined);
    }
    // Seasons + episodes: UNION across lines. Release name might say
    // "S01 Complete" and filename "S01E01" — keep both so we know it's a
    // pack AND know which episode the resolver should pick.
    if (r.seasons?.length) merged.seasons = [...(merged.seasons ?? []), ...r.seasons];
    if (r.episodes?.length) merged.episodes = [...(merged.episodes ?? []), ...r.episodes];
    if (r.complete) merged.complete = true;
    // Editions union across lines + promote the standalone `extended` flag
    // to the editions list so a single "Extended" tag in the filename still
    // surfaces under the edition block.
    if (r.editions?.length) merged.editions = [...(merged.editions ?? []), ...r.editions];
    if (r.extended) merged.editions = [...(merged.editions ?? []), "Extended"];
  }

  const uniqSeasons = uniqueSortedInts(merged.seasons ?? []);
  const uniqEpisodes = uniqueSortedInts(merged.episodes ?? []);

  // Pack detection: any of —
  //   • COMPLETE keyword present (regardless of S/E)
  //   • Seasons present, no specific episodes
  //   • Multi-episode range with >5 episodes (batch / range release)
  //   • Multi-season title
  const seasonPack =
    !!merged.complete ||
    (uniqSeasons.length > 0 && uniqEpisodes.length === 0) ||
    uniqEpisodes.length > 5 ||
    uniqSeasons.length > 1;

  // Audio: pick the first reported value, with a touch of normalisation
  // for "DDP/EAC-3" variants that the library reports differently. The
  // library packs Atmos / TrueHD / DTS / etc. all into `audio` without
  // distinguishing channel layout — scan for the highest-priority codec.
  const audioList = (merged.audio ?? []).map((a) => a.toLowerCase());
  const audioCodec =
    mapAudioCodec(audioList.find((a) => a === "truehd" || a === "atmos")) ??
    mapAudioCodec(audioList.find((a) => a === "dts-hd" || a === "dtshd")) ??
    mapAudioCodec(audioList.find((a) => a === "dts")) ??
    mapAudioCodec(audioList.find((a) => a === "eac3" || a === "ddp")) ??
    mapAudioCodec(audioList.find((a) => a === "ac3" || a === "dd")) ??
    mapAudioCodec(audioList[0]);

  // Channels layout: the library reports "5.1" / "7.1" / etc. in
  // `audiochannels`, but Atmos appears under `audio` because it's both a
  // codec and a layout. Coalesce: explicit channels wins, otherwise
  // promote Atmos so the UI still gets the spatial-audio hint.
  let audioChannels: string | null = merged.audiochannels?.[0] ?? merged.channels?.[0] ?? null;
  if (!audioChannels && audioList.includes("atmos")) audioChannels = "Atmos";
  if (audioChannels === "atmos") audioChannels = "Atmos";

  // Source tag — the library often reports "BluRay" for titles containing
  // both BluRay AND REMUX (Remux is technically a BluRay derivative). Sonarr/
  // Radarr treat Remux as a more specific tag worth preferring, so we
  // re-scan the joined title before falling back to the library value.
  let sourceTag = mapSourceTag(merged.quality ?? merged.source);
  if (sourceTag === "BluRay" && /\bremux\b/i.test(rawTitle ?? "")) {
    sourceTag = "Remux";
  }

  // Languages — the library tags "multi audio" / "dual audio" as a single
  // entry; collapse to the bare "multi" / "dual" tokens our consumers expect.
  const langs = (merged.languages ?? []).map((l) => {
    const k = l.toLowerCase().trim();
    if (k === "multi audio" || k === "multi-audio") return "multi";
    if (k === "dual audio" || k === "dual-audio") return "dual";
    return k;
  });

  // Normalise the parsed title: PTT often returns "Dune.Part.Two" or
  // "Dune_Part_Two" verbatim; replace separators with spaces and collapse
  // whitespace so the formatter doesn't have to.
  const cleanTitle = merged.title?.replace(/[._]+/g, " ").replace(/\s+/g, " ").trim() || null;
  const parsedYearNum = merged.year ? parseInt(merged.year, 10) : NaN;
  const parsedYear = Number.isFinite(parsedYearNum) ? parsedYearNum : null;
  const editions = Array.from(new Set(merged.editions ?? []));

  return {
    releaseGroup: merged.group ?? null,
    resolution: mapResolution(merged.resolution),
    codec: mapCodec(merged.codec),
    hdrFlags: mapHdrFlags(merged.hdr),
    audioCodec,
    audioChannels,
    languages: Array.from(new Set(langs)),
    sourceTag,
    parsedTitle: cleanTitle,
    parsedYear,
    editions,
    seasons: uniqSeasons,
    episodes: uniqEpisodes,
    seasonPack,
  };
}

export function parseCandidate(candidate: StreamCandidate): ParsedStreamCandidate {
  const parsed = parseReleaseName(candidate.rawTitle);
  return {
    ...candidate,
    ...parsed,
  };
}

/**
 * Best-effort byte-size parser for source-emitted size labels like
 * "Size: 12.4 GB" or "3.5GiB". Returns null when no size token is found.
 *
 * Useful when an indexer puts the size only in the description string.
 */
export function parseSizeBytes(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(b|kb|mb|gb|tb|kib|mib|gib|tib)/i);
  if (!match) return null;
  const value = parseFloat(match[1]!.replace(",", "."));
  if (Number.isNaN(value)) return null;
  const unit = match[2]!.toLowerCase();
  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024, kib: 1024,
    mb: 1024 ** 2, mib: 1024 ** 2,
    gb: 1024 ** 3, gib: 1024 ** 3,
    tb: 1024 ** 4, tib: 1024 ** 4,
  };
  const mult = multipliers[unit];
  if (!mult) return null;
  return Math.round(value * mult);
}

/**
 * Best-effort seeders/peers extractor. Many indexers cram these into the
 * description as "👤 245" or "Seeders: 245". Returns the seeder count or null.
 */
export function parseSeeders(text: string): number | null {
  if (!text) return null;
  const labeled = text.match(/(?:seed(?:ers?)?|👥|👤|⬆)\s*[:=]?\s*(\d+)/i);
  if (labeled) return parseInt(labeled[1]!, 10);
  return null;
}
