/**
 * External external addon source — wraps any third-party manifest URL.
 *
 * Handles BOTH stream shapes a external addon can return:
 *
 *   - `url`        → already-resolved HTTP URL (AIOStreams, Comet streams
 *                    pre-resolved against a debrid the addon was given keys
 *                    for, EasyNews-style direct downloads).
 *   - `infoHash`   → torrent hash (Torrentio without debrid configured,
 *                    MediaFusion, Comet without addon-side debrid). These
 *                    flow through Rewind's own debrid resolvers downstream
 *                    so the addon doesn't need credentials.
 *
 * `kind = "direct"` is set at the source level because the most common case
 * is a fully-resolved URL, but the per-candidate `infoHash`/`url` field is
 * what actually routes through the pipeline.
 *
 * Config blob: `{}` — no extra config; the manifest URL lives in `url`.
 */
import type { StreamSourceRow } from "@forge/types";
import { candidateId, fetchJson } from "./base";
import type {
  StreamCandidate,
  StreamQuery,
  StreamSource,
} from "../types";

type AddonStream = {
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  title?: string;
  name?: string;
  description?: string;
  behaviorHints?: { bingeGroup?: string; filename?: string };
  sources?: string[];
};

type AddonResponse = { streams?: AddonStream[] };

export class ExternalAddonSource implements StreamSource {
  readonly type = "external-addon";
  readonly kind = "direct" as const;

  constructor(private readonly row: StreamSourceRow) {}

  async search(query: StreamQuery, signal?: AbortSignal): Promise<StreamCandidate[]> {
    if (!this.row.url) return [];
    const base = this.row.url.replace(/\/manifest\.json$/, "").replace(/\/$/, "");
    const addonType = query.kind === "movie" ? "movie" : "series";
    const id = query.kind === "series" && query.season != null && query.episode != null
      ? `${query.imdbId}:${query.season}:${query.episode}`
      : (query.imdbId ?? "");
    if (!id) return [];

    const data = await fetchJson<AddonResponse>(
      `${base}/stream/${addonType}/${encodeURIComponent(id)}.json`,
      { signal },
    );
    if (!data?.streams?.length) return [];

    return data.streams
      .filter((s) => !!s.url || !!s.infoHash)
      .map((s) => {
        // Addon convention: human-readable label often appears in `title`,
        // the short header in `name`. Use whichever has the most info as the
        // parseable raw title.
        const rawTitle = s.title ?? s.behaviorHints?.filename ?? s.description ?? "";
        const localKey = s.url ?? `${s.infoHash}:${s.fileIdx ?? 0}`;
        return {
          id: candidateId(this.row.id, localKey),
          sourceType: "external-addon",
          sourceId: this.row.id,
          name: s.name ?? this.row.name,
          description: s.description ?? s.title ?? "",
          rawTitle,
          // Forward whichever identifier the addon gave us. The pipeline
          // routes per-candidate: `url` → no resolver; `infoHash` → debrid.
          url: s.url ?? undefined,
          infoHash: s.infoHash?.toLowerCase(),
          bingeGroup: s.behaviorHints?.bingeGroup,
          meta: { fileIdx: s.fileIdx, trackers: s.sources },
        };
      });
  }
}
