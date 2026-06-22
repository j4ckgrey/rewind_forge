/**
 * Block-based stream label formatter.
 *
 * The user picks blocks in the Formatter tab (puzzle-style) and chooses a
 * STYLE per block. Blocks are organised by CATEGORY (resolution, codec,
 * audio, …) and a single category contributes ONE chunk to the final label
 * — picking a new style for a category replaces the previous style.
 *
 * Output shape mirrors the existing media_streams columns: `title` (the
 * stream picker's bold line) and `subtitle` (one or more lines underneath).
 *
 * Why blocks instead of AIOStreams' templating DSL: zero syntax to learn,
 * every option has a finite enumerable style set, and the UI can show a
 * live preview because each block's render is a pure function of the
 * parsed stream.
 */

import type { ResolvedStream } from "./types";

// ─── Block categories + styles ───────────────────────────────────────────

export type BlockCategory =
  | "title"
  | "edition"
  | "resolution"
  | "quality"
  | "hdr"
  | "codec"
  | "audio"
  | "channels"
  | "languages"
  | "sourceType"
  | "cache"
  | "size"
  | "seeders"
  | "releaseGroup"
  | "seasonEpisode"
  | "episodeName"
  | "pack"
  | "addon"
  | "filename"
  | "separator"
  | "newline";

/** A block placed in a row. Each block lives in exactly one category. */
export type FormatterBlock = {
  /** Category — picks which piece of stream metadata this renders. */
  category: BlockCategory;
  /** Style key inside the category. Validated against CATEGORY_STYLES. */
  style: string;
};

/** A row in the rendered output. Subtitle has many rows; title has one. */
export type FormatterRow = {
  blocks: FormatterBlock[];
  /** String between blocks within this row. Defaults to a space. */
  separator: string;
};

export type FormatterConfig = {
  /** Single line, bold in the stream picker. */
  title: FormatterRow;
  /** Subtitle paragraph — each row renders on its own line. */
  subtitle: FormatterRow[];
};

// ─── Style definitions ───────────────────────────────────────────────────

type StyleDef = {
  id: string;
  label: string;
  /** Returns the rendered chunk, or "" to omit when the metadata is missing. */
  render: (s: ResolvedStream, ctx: RenderContext) => string;
};

type RenderContext = {
  addonName?: string | null;
  episodeName?: string | null;
  /** Full debrid name for the resolver that will play this stream, e.g.
   *  "Real-Debrid" / "TorBox". Null for direct (already-resolved) streams. */
  debridName?: string | null;
  /** Short debrid tag, e.g. "RD" / "TB". Used for compact labels. */
  debridTag?: string | null;
};

const RES_MAP_NAMES: Record<string, string> = {
  "2160p": "4K",
  "1080p": "FHD",
  "720p": "HD",
  "480p": "SD",
  "unknown": "",
};
const RES_MAP_EMOJI: Record<string, string> = {
  "2160p": "🔥 4K",
  "1080p": "🚀 FHD",
  "720p": "💿 HD",
  "480p": "📺 SD",
  "unknown": "",
};

const CATEGORY_STYLES: Record<BlockCategory, StyleDef[]> = {
  title: [
    {
      id: "plain",
      label: "Plain (Dune Part Two)",
      render: (s) => s.parsedTitle ?? "",
    },
    {
      id: "withYear",
      label: "With year (Dune Part Two (2024))",
      render: (s) => {
        if (!s.parsedTitle) return "";
        return s.parsedYear ? `${s.parsedTitle} (${s.parsedYear})` : s.parsedTitle;
      },
    },
    {
      id: "withEdition",
      label: "With edition (Dune… · Director's Cut)",
      render: (s) => {
        if (!s.parsedTitle) return "";
        return s.editions.length > 0
          ? `${s.parsedTitle} · ${s.editions.join(" · ")}`
          : s.parsedTitle;
      },
    },
    {
      id: "full",
      label: "Full (Dune Part Two (2024) · Director's Cut)",
      render: (s) => {
        if (!s.parsedTitle) return "";
        const yearPart = s.parsedYear ? ` (${s.parsedYear})` : "";
        const editionPart = s.editions.length > 0 ? ` · ${s.editions.join(" · ")}` : "";
        return `${s.parsedTitle}${yearPart}${editionPart}`;
      },
    },
    {
      id: "emoji",
      label: "Emoji (🎬 Dune Part Two)",
      render: (s) => (s.parsedTitle ? `🎬 ${s.parsedTitle}` : ""),
    },
  ],
  edition: [
    {
      id: "text",
      label: "Text (Director's Cut)",
      render: (s) => s.editions.join(" · "),
    },
    {
      id: "bracket",
      label: "Bracket ([Director's Cut])",
      render: (s) => (s.editions.length > 0 ? s.editions.map((e) => `[${e}]`).join("") : ""),
    },
    {
      id: "emoji",
      label: "Emoji (🎬 Director's Cut)",
      render: (s) => (s.editions.length > 0 ? `🎬 ${s.editions.join(" · ")}` : ""),
    },
  ],
  resolution: [
    {
      id: "numbers",
      label: "Numbers (2160p / 1080p)",
      render: (s) => (s.resolution !== "unknown" ? s.resolution : ""),
    },
    {
      id: "names",
      label: "Names (4K / FHD / HD)",
      render: (s) => RES_MAP_NAMES[s.resolution] ?? "",
    },
    {
      id: "emoji",
      label: "Emoji (🔥 4K)",
      render: (s) => RES_MAP_EMOJI[s.resolution] ?? "",
    },
  ],
  quality: [
    {
      id: "full",
      label: "Full (BluRay Remux)",
      render: (s) => (s.sourceTag ?? ""),
    },
    {
      id: "short",
      label: "Short (BR / RMX / WEB)",
      render: (s) => {
        if (!s.sourceTag) return "";
        const map: Record<string, string> = {
          BluRay: "BR", Remux: "RMX", "WEB-DL": "WEB", WEBRip: "WRP",
          HDTV: "HDTV", DVDRip: "DVD", CAM: "CAM", TS: "TS",
        };
        return map[s.sourceTag] ?? s.sourceTag;
      },
    },
    {
      id: "tagged",
      label: "Tagged ([BluRay])",
      render: (s) => (s.sourceTag ? `[${s.sourceTag}]` : ""),
    },
  ],
  hdr: [
    {
      id: "emoji",
      label: "Emoji (🌈 HDR / 🌟 DV)",
      render: (s) => renderHdr(s, "emoji"),
    },
    {
      id: "text",
      label: "Text (HDR · DV)",
      render: (s) => renderHdr(s, "text"),
    },
    {
      id: "bracket",
      label: "Bracket ([HDR][DV])",
      render: (s) => renderHdr(s, "bracket"),
    },
  ],
  codec: [
    {
      id: "modern",
      label: "Modern (HEVC / AVC)",
      render: (s) => {
        if (!s.codec) return "";
        const map: Record<string, string> = { h265: "HEVC", h264: "AVC", av1: "AV1", vp9: "VP9", mpeg2: "MPEG-2" };
        return map[s.codec] ?? s.codec;
      },
    },
    {
      id: "encoder",
      label: "Encoder (x265 / x264)",
      render: (s) => {
        if (!s.codec) return "";
        const map: Record<string, string> = { h265: "x265", h264: "x264", av1: "AV1", vp9: "VP9", mpeg2: "MPEG-2" };
        return map[s.codec] ?? s.codec;
      },
    },
    {
      id: "emoji",
      label: "Emoji (🎞️ HEVC)",
      render: (s) => {
        if (!s.codec) return "";
        const map: Record<string, string> = { h265: "HEVC", h264: "AVC", av1: "AV1", vp9: "VP9", mpeg2: "MPEG-2" };
        return `🎞️ ${map[s.codec] ?? s.codec}`;
      },
    },
  ],
  audio: [
    {
      id: "text",
      label: "Text (Atmos / DTS-HD)",
      render: (s) => renderAudio(s),
    },
    {
      id: "emoji",
      label: "Emoji (🎧 Atmos)",
      render: (s) => {
        const v = renderAudio(s);
        return v ? `🎧 ${v}` : "";
      },
    },
  ],
  channels: [
    {
      id: "number",
      label: "Number (5.1 / 7.1)",
      render: (s) => s.audioChannels ?? "",
    },
    {
      id: "emoji",
      label: "Emoji (🔊 5.1)",
      render: (s) => (s.audioChannels ? `🔊 ${s.audioChannels}` : ""),
    },
  ],
  languages: [
    {
      id: "flags",
      label: "Flags (🇺🇸 🇪🇸)",
      render: (s) => s.languages.map(langToFlag).filter(Boolean).join(" "),
    },
    {
      id: "codes",
      label: "Codes (EN · ES)",
      render: (s) => s.languages.map((l) => l.toUpperCase()).join(" · "),
    },
    {
      id: "compact",
      label: "Compact (🌐 3 langs)",
      render: (s) => (s.languages.length > 0 ? `🌐 ${s.languages.length} lang${s.languages.length > 1 ? "s" : ""}` : ""),
    },
  ],
  sourceType: [
    {
      id: "emoji",
      label: "Emoji (⚡ Debrid / 🌱 P2P)",
      render: (s, ctx) => {
        // Show WHICH debrid when known ("⚡ RD") so a multi-debrid setup is
        // distinguishable at a glance; fall back to the bare bolt otherwise.
        if (s.url?.startsWith("magnet:") || s.infoHash) {
          // Assumed (debrid that can't verify) → still a debrid, flag unknown.
          if (s.assumedCached) return ctx.debridTag ? `❔ ${ctx.debridTag}` : "❔";
          if (!s.cachedOnDebrid) return "🌱";
          return ctx.debridTag ? `⚡ ${ctx.debridTag}` : "⚡";
        }
        if (s.nzbId) return "📰";
        return s.url ? "💻" : "";
      },
    },
    {
      id: "text",
      label: "Text ([Debrid] / [P2P])",
      render: (s, ctx) => {
        if (s.infoHash) {
          if (s.assumedCached) return ctx.debridTag ? `[${ctx.debridTag}?]` : "[Debrid?]";
          if (!s.cachedOnDebrid) return "[P2P]";
          return ctx.debridTag ? `[${ctx.debridTag}]` : "[Debrid]";
        }
        if (s.nzbId) return "[Usenet]";
        return s.url ? "[Web]" : "";
      },
    },
  ],
  cache: [
    {
      id: "emoji",
      label: "Emoji (⚡ / ❔ / ⏳)",
      render: (s, ctx) => {
        if (!s.resolverId) return "";
        // Assumed-available (provider can't verify, e.g. RD): flag as unknown.
        if (s.assumedCached) return ctx.debridTag ? `❔ ${ctx.debridTag}` : "❔";
        if (!s.cachedOnDebrid) return "⏳";
        return ctx.debridTag ? `⚡ ${ctx.debridTag}` : "⚡";
      },
    },
    {
      id: "text",
      // Stremio-style: "[RD+]" = verified cached, "[RD?]" = assumed (provider
      // can't verify), "[RD ⏳]" = needs download. Shows which debrid + status.
      label: "Text ([RD+] / [RD?] / [Download])",
      render: (s, ctx) => {
        if (!s.resolverId) return "";
        if (s.assumedCached) return ctx.debridTag ? `[${ctx.debridTag}?]` : "[Cache?]";
        if (s.cachedOnDebrid) return ctx.debridTag ? `[${ctx.debridTag}+]` : "[Cached]";
        return ctx.debridTag ? `[${ctx.debridTag} ⏳]` : "[Download]";
      },
    },
    {
      id: "name",
      label: "Provider name (Real-Debrid)",
      render: (s, ctx) => {
        if (!s.resolverId || !ctx.debridName) return "";
        if (s.assumedCached) return `${ctx.debridName} (unverified)`;
        return s.cachedOnDebrid ? ctx.debridName : `${ctx.debridName} (download)`;
      },
    },
  ],
  size: [
    {
      id: "smart",
      label: "Smart (4.5 GB)",
      render: (s) => (s.sizeBytes ? formatBytes(s.sizeBytes) : ""),
    },
    {
      id: "emoji",
      label: "Emoji (📦 4.5 GB)",
      render: (s) => (s.sizeBytes ? `📦 ${formatBytes(s.sizeBytes)}` : ""),
    },
    {
      id: "compact",
      label: "Compact (4.5G)",
      render: (s) => (s.sizeBytes ? formatBytesCompact(s.sizeBytes) : ""),
    },
  ],
  seeders: [
    {
      id: "number",
      label: "Number (245)",
      render: (s) => (s.seeders != null ? String(s.seeders) : ""),
    },
    {
      id: "emoji",
      label: "Emoji (👤 245)",
      render: (s) => (s.seeders != null ? `👤 ${s.seeders}` : ""),
    },
  ],
  releaseGroup: [
    {
      id: "text",
      label: "Text (FLUX)",
      render: (s) => s.releaseGroup ?? "",
    },
    {
      id: "bracket",
      label: "Bracket ([FLUX])",
      render: (s) => (s.releaseGroup ? `[${s.releaseGroup}]` : ""),
    },
    {
      id: "tagged",
      label: "Tagged (🏷️ FLUX)",
      render: (s) => (s.releaseGroup ? `🏷️ ${s.releaseGroup}` : ""),
    },
  ],
  seasonEpisode: [
    {
      id: "full",
      label: "Full (S01E05)",
      render: (s) => renderSeasonEpisode(s, "full"),
    },
    {
      id: "short",
      label: "Short (1x05)",
      render: (s) => renderSeasonEpisode(s, "short"),
    },
    {
      id: "compact",
      label: "Compact (s01·e05)",
      render: (s) => renderSeasonEpisode(s, "compact"),
    },
  ],
  episodeName: [
    {
      id: "plain",
      label: "Plain (Pilot)",
      render: (_s, ctx) => ctx.episodeName ?? "",
    },
    {
      id: "bracket",
      label: "Bracket ([Pilot])",
      render: (_s, ctx) => (ctx.episodeName ? `[${ctx.episodeName}]` : ""),
    },
    {
      id: "emoji",
      label: "Emoji (🎬 Pilot)",
      render: (_s, ctx) => (ctx.episodeName ? `🎬 ${ctx.episodeName}` : ""),
    },
  ],
  pack: [
    {
      id: "bracket",
      label: "Bracket ([Pack])",
      render: (s) => renderPack(s, "bracket"),
    },
    {
      id: "emoji",
      label: "Emoji (📦 Pack)",
      render: (s) => renderPack(s, "emoji"),
    },
    {
      id: "short",
      label: "Short ([S1 Pack])",
      render: (s) => renderPack(s, "short"),
    },
  ],
  addon: [
    {
      id: "name",
      label: "Name (Comet)",
      render: (_s, ctx) => ctx.addonName ?? "",
    },
    {
      id: "bracket",
      label: "Bracket ([Comet])",
      render: (_s, ctx) => (ctx.addonName ? `[${ctx.addonName}]` : ""),
    },
    {
      id: "emoji",
      label: "Emoji (🔍 Comet)",
      render: (_s, ctx) => (ctx.addonName ? `🔍 ${ctx.addonName}` : ""),
    },
  ],
  filename: [
    {
      id: "full",
      label: "Full (full filename)",
      render: (s) => extractFilename(s),
    },
    {
      id: "truncated",
      label: "Truncated (40 chars)",
      render: (s) => {
        const f = extractFilename(s);
        return f.length > 40 ? f.slice(0, 37) + "…" : f;
      },
    },
    {
      id: "emoji",
      label: "Emoji (📁 filename)",
      render: (s) => {
        const f = extractFilename(s);
        return f ? `📁 ${f}` : "";
      },
    },
  ],
  separator: [
    { id: "dot", label: "Dot ( · )", render: () => "·" },
    { id: "pipe", label: "Pipe ( | )", render: () => "|" },
    { id: "dash", label: "Dash ( – )", render: () => "–" },
    { id: "bullet", label: "Bullet ( • )", render: () => "•" },
  ],
  newline: [{ id: "break", label: "New line", render: () => "\n" }],
};

// ─── Renderer helpers ───────────────────────────────────────────────────

const HDR_FLAG_HDR10 = 1;
const HDR_FLAG_DV = 2;
const HDR_FLAG_HDR10_PLUS = 4;
const HDR_FLAG_HLG = 8;

function renderHdr(s: ResolvedStream, mode: "emoji" | "text" | "bracket"): string {
  const tags: string[] = [];
  if (s.hdrFlags & HDR_FLAG_HDR10_PLUS) tags.push("HDR10+");
  else if (s.hdrFlags & HDR_FLAG_HDR10) tags.push("HDR");
  if (s.hdrFlags & HDR_FLAG_DV) tags.push("DV");
  if (s.hdrFlags & HDR_FLAG_HLG) tags.push("HLG");
  if (tags.length === 0) return "";
  if (mode === "emoji") {
    return tags
      .map((t) => (t === "DV" ? "🌟 DV" : t.startsWith("HDR") ? `🌈 ${t}` : t === "HLG" ? "🎨 HLG" : t))
      .join(" ");
  }
  if (mode === "bracket") return tags.map((t) => `[${t}]`).join("");
  return tags.join(" · ");
}

function renderAudio(s: ResolvedStream): string {
  if (!s.audioCodec) return "";
  const map: Record<string, string> = {
    truehd: "TrueHD",
    "dts-hd": "DTS-HD",
    dts: "DTS",
    eac3: "EAC3",
    ac3: "AC3",
    aac: "AAC",
    opus: "Opus",
    flac: "FLAC",
    mp3: "MP3",
  };
  return map[s.audioCodec] ?? s.audioCodec.toUpperCase();
}

function renderSeasonEpisode(s: ResolvedStream, mode: "full" | "short" | "compact"): string {
  if (s.seasons.length === 0 && s.episodes.length === 0) return "";
  const ss = s.seasons[0];
  const ee = s.episodes[0];
  if (ss == null && ee == null) return "";
  if (mode === "full") {
    const sPart = ss != null ? `S${String(ss).padStart(2, "0")}` : "";
    const ePart = ee != null ? `E${String(ee).padStart(2, "0")}` : "";
    return `${sPart}${ePart}`;
  }
  if (mode === "short") {
    if (ss != null && ee != null) return `${ss}x${String(ee).padStart(2, "0")}`;
    if (ee != null) return `Ep ${ee}`;
    return `S${ss}`;
  }
  // compact
  const sPart = ss != null ? `s${String(ss).padStart(2, "0")}` : "";
  const ePart = ee != null ? `e${String(ee).padStart(2, "0")}` : "";
  return [sPart, ePart].filter(Boolean).join("·");
}

function renderPack(s: ResolvedStream, mode: "bracket" | "emoji" | "short"): string {
  if (!s.seasonPack) return "";
  if (mode === "emoji") return "📦 Pack";
  if (mode === "short") {
    if (s.seasons.length === 1) return `[S${String(s.seasons[0]).padStart(2, "0")} Pack]`;
    if (s.seasons.length > 1) {
      const a = String(s.seasons[0]).padStart(2, "0");
      const b = String(s.seasons[s.seasons.length - 1]).padStart(2, "0");
      return `[S${a}-S${b} Pack]`;
    }
    if (s.episodes.length > 5) return `[${s.episodes.length}-Ep Batch]`;
    return "[Pack]";
  }
  return "[Pack]";
}

function extractFilename(s: ResolvedStream): string {
  // Description sometimes contains the per-line filename. Pick the line that
  // looks most like a video file (ends in .mkv / .mp4 / etc.).
  const text = `${s.description ?? ""}\n${s.rawTitle ?? ""}`;
  for (const line of text.split(/[\r\n]/)) {
    const t = line.trim();
    if (/\.(mkv|mp4|avi|m4v|ts|webm)$/i.test(t)) return t;
  }
  return s.rawTitle ?? "";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unit]}`;
}

function formatBytesCompact(bytes: number): string {
  return formatBytes(bytes).replace(" ", "").replace("KB", "K").replace("MB", "M").replace("GB", "G").replace("TB", "T");
}

const FLAG_MAP: Record<string, string> = {
  en: "🇺🇸", es: "🇪🇸", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹",
  pt: "🇵🇹", ru: "🇷🇺", ja: "🇯🇵", ko: "🇰🇷", zh: "🇨🇳",
  hi: "🇮🇳", ar: "🇸🇦", multi: "🌐", dual: "🎭",
};
function langToFlag(code: string): string {
  return FLAG_MAP[code.toLowerCase()] ?? code.toUpperCase();
}

// ─── Public API ──────────────────────────────────────────────────────────

/** All categories with their available styles — feeds the dashboard UI. */
export function listCategoryStyles(): Array<{
  category: BlockCategory;
  styles: Array<{ id: string; label: string }>;
}> {
  return (Object.keys(CATEGORY_STYLES) as BlockCategory[]).map((category) => ({
    category,
    styles: CATEGORY_STYLES[category].map(({ id, label }) => ({ id, label })),
  }));
}

/** Render a single row to a string. Empty blocks are dropped before joining. */
function renderRow(row: FormatterRow, s: ResolvedStream, ctx: RenderContext): string {
  const parts: string[] = [];
  for (const block of row.blocks) {
    const styleDef = CATEGORY_STYLES[block.category]?.find((d) => d.id === block.style);
    if (!styleDef) continue;
    const chunk = styleDef.render(s, ctx);
    if (chunk) parts.push(chunk);
  }
  const sep = row.separator || " ";
  return parts.join(sep);
}

/** Top-level: render a stream into the user-facing name + description. */
export function formatStream(
  s: ResolvedStream,
  cfg: FormatterConfig,
  ctx: RenderContext = {},
): { title: string; subtitle: string } {
  const title = renderRow(cfg.title, s, ctx);
  const subtitle = cfg.subtitle.map((row) => renderRow(row, s, ctx)).filter(Boolean).join("\n");
  return { title, subtitle };
}

function hasAnySeriesContextBlock(cfg: FormatterConfig): boolean {
  const rows = [cfg.title, ...cfg.subtitle];
  return rows.some((row) =>
    row.blocks.some((block) => block.category === "seasonEpisode" || block.category === "episodeName"),
  );
}

function injectDefaultSeriesContext(cfg: FormatterConfig): FormatterConfig {
  if (hasAnySeriesContextBlock(cfg)) return cfg;

  const titleBlocks: FormatterBlock[] = [
    ...cfg.title.blocks,
    { category: "seasonEpisode", style: "short" },
  ];
  const subtitle: FormatterRow[] = cfg.subtitle.length > 0
    ? cfg.subtitle.map((row, idx) =>
        idx === 0
          ? { ...row, blocks: [{ category: "episodeName", style: "plain" } as FormatterBlock, ...row.blocks] }
          : row,
      )
    : [{ separator: " · ", blocks: [{ category: "episodeName", style: "plain" }] }];

  return {
    title: { ...cfg.title, blocks: titleBlocks },
    subtitle,
  };
}

// ─── Default config + presets ───────────────────────────────────────────

export const DEFAULT_FORMATTER_CONFIG: FormatterConfig = {
  title: {
    separator: " ",
    blocks: [
      { category: "cache", style: "emoji" },
      { category: "addon", style: "bracket" },
      { category: "resolution", style: "names" },
      { category: "seasonEpisode", style: "short" },
      { category: "pack", style: "short" },
    ],
  },
  subtitle: [
    {
      separator: " · ",
      blocks: [{ category: "episodeName", style: "plain" }],
    },
    {
      separator: " · ",
      blocks: [
        { category: "quality", style: "full" },
        { category: "codec", style: "modern" },
        { category: "hdr", style: "emoji" },
      ],
    },
    {
      separator: " · ",
      blocks: [
        { category: "audio", style: "text" },
        { category: "channels", style: "number" },
        { category: "languages", style: "flags" },
      ],
    },
    {
      separator: " · ",
      blocks: [
        { category: "size", style: "emoji" },
        { category: "seeders", style: "emoji" },
        { category: "releaseGroup", style: "tagged" },
      ],
    },
  ],
};

export const PRESET_MINIMAL: FormatterConfig = {
  title: {
    separator: " ",
    blocks: [
      { category: "resolution", style: "names" },
      { category: "seasonEpisode", style: "short" },
      { category: "pack", style: "bracket" },
    ],
  },
  subtitle: [
    {
      separator: " · ",
      blocks: [
        { category: "episodeName", style: "plain" },
        { category: "quality", style: "short" },
        { category: "size", style: "smart" },
        { category: "languages", style: "codes" },
      ],
    },
  ],
};

export const PRESET_PRISM: FormatterConfig = {
  title: {
    separator: " ",
    blocks: [
      { category: "resolution", style: "emoji" },
      { category: "cache", style: "emoji" },
      { category: "seasonEpisode", style: "short" },
    ],
  },
  subtitle: [
    {
      separator: " ",
      blocks: [
        { category: "episodeName", style: "emoji" },
        { category: "quality", style: "tagged" },
        { category: "hdr", style: "emoji" },
        { category: "audio", style: "emoji" },
      ],
    },
    {
      separator: " ",
      blocks: [
        { category: "size", style: "emoji" },
        { category: "seeders", style: "emoji" },
        { category: "addon", style: "emoji" },
      ],
    },
  ],
};

export const PRESETS: Record<string, FormatterConfig> = {
  default: DEFAULT_FORMATTER_CONFIG,
  minimal: PRESET_MINIMAL,
  prism: PRESET_PRISM,
};

// ─── Validation ──────────────────────────────────────────────────────────

/** Sanitises an untrusted config — drops unknown categories/styles and clamps
 *  the depth. Returns DEFAULT_FORMATTER_CONFIG when the input is unparseable. */
export function parseFormatterConfig(raw: unknown): FormatterConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_FORMATTER_CONFIG;
  const obj = raw as Record<string, unknown>;
  const validRow = (row: unknown): FormatterRow | null => {
    if (!row || typeof row !== "object") return null;
    const r = row as { blocks?: unknown; separator?: unknown };
    if (!Array.isArray(r.blocks)) return null;
    const blocks: FormatterBlock[] = [];
    for (const b of r.blocks.slice(0, 20)) {
      if (!b || typeof b !== "object") continue;
      const { category, style } = b as { category?: unknown; style?: unknown };
      if (typeof category !== "string" || typeof style !== "string") continue;
      const cat = CATEGORY_STYLES[category as BlockCategory];
      if (!cat) continue;
      if (!cat.find((s) => s.id === style)) continue;
      blocks.push({ category: category as BlockCategory, style });
    }
    return { blocks, separator: typeof r.separator === "string" ? r.separator : " " };
  };
  const title = validRow(obj.title) ?? DEFAULT_FORMATTER_CONFIG.title;
  const subtitleRaw = Array.isArray(obj.subtitle) ? obj.subtitle.slice(0, 8) : [];
  const subtitle = subtitleRaw.map(validRow).filter((r): r is FormatterRow => !!r);
  if (subtitle.length === 0) return DEFAULT_FORMATTER_CONFIG;
  return injectDefaultSeriesContext({ title, subtitle });
}
