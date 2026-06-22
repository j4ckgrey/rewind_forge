/**
 * Torznab / NewzNab source — generic indexer protocol used by Prowlarr,
 * Jackett, NZBHydra2, and most usenet indexer aggregators.
 *
 * One adapter handles both Torznab (torrents) and NewzNab (NZB) because the
 * XML response shape is identical except for the `attr` codes carrying
 * infoHash (torznab) vs. nzbid/guid (newznab).
 *
 * Config blob:
 *   { apiKey?: string, kind: "torznab" | "newznab", categories?: number[] }
 *     apiKey usually goes in the URL query (?apikey=...). categories filters
 *     the search (movies=2000, tv=5000 by NewzNab convention).
 */
import type { StreamSourceRow } from "@forge/types";
import { candidateId, fetchText, readSourceConfig } from "./base";
import type {
  StreamCandidate,
  StreamQuery,
  StreamSource,
} from "../types";

type TorznabConfig = {
  kind: "torznab" | "newznab";
  categories: number[];
  apiKey: string;
};

export class TorznabSource implements StreamSource {
  readonly type: string;
  readonly kind: "torrent" | "usenet";

  constructor(private readonly row: StreamSourceRow) {
    // source_type discriminates which variant we're acting as — both share
    // this class but report different `kind` values so the pipeline knows
    // which resolver category to pair them with.
    this.type = row.source_type;
    const isUsenet = row.source_type === "newznab" || row.source_type === "nzbhydra";
    this.kind = isUsenet ? "usenet" : "torrent";
  }

  async search(query: StreamQuery, signal?: AbortSignal): Promise<StreamCandidate[]> {
    if (!this.row.url) return [];
    const cfg = readSourceConfig<TorznabConfig>(this.row, {
      kind: this.kind === "usenet" ? "newznab" : "torznab",
      categories: this.kind === "usenet"
        ? (query.kind === "movie" ? [2000] : [5000])
        : (query.kind === "movie" ? [2000] : [5000]),
      apiKey: this.row.api_key ?? "",
    });

    const params = new URLSearchParams();
    params.set("t", query.kind === "movie" ? "movie" : "tvsearch");
    if (cfg.apiKey || this.row.api_key) params.set("apikey", cfg.apiKey || this.row.api_key!);
    if (cfg.categories?.length) params.set("cat", cfg.categories.join(","));
    if (query.imdbId) params.set("imdbid", query.imdbId.replace(/^tt/i, ""));
    if (query.kind === "series") {
      if (query.season != null) params.set("season", String(query.season));
      if (query.episode != null) params.set("ep", String(query.episode));
    }
    // Text query. Always send it for series — most private torrent trackers
    // (Jackett/Prowlarr torznab) can't map an imdbid to a specific episode, so
    // an id-only tvsearch returns nothing and episodes appear to "only play
    // from built-in addons". Sending `q=<show>&season=&ep=` is the Sonarr
    // convention; indexers that DO honour imdbid simply ignore the extra q.
    // Movies stay imdbid-only when an id is present (reliable, avoids title
    // noise), falling back to q when there's no id.
    if (query.title && (query.kind === "series" || !query.imdbId)) {
      params.set("q", query.title);
    }

    const base = this.row.url.replace(/\/$/, "");
    const url = `${base}/api?${params.toString()}`;

    const xml = await fetchText(url, { signal });
    if (!xml) return [];

    return parseTorznabXml(xml, this.row, this.kind === "usenet");
  }
}

/**
 * Minimal Torznab XML parser. RSS items live under <item>, and each item has
 * <link> (download URL) plus a series of <torznab:attr name="x" value="y"/>
 * tags for sideband metadata (size, seeders, infohash).
 *
 * We use regex rather than a full XML parser because Torznab responses are
 * narrow and well-formed (no namespaces beyond `torznab:`/`newznab:`) — a
 * dedicated DOM parser would pull in a much larger dependency for this.
 */
function parseTorznabXml(
  xml: string,
  row: StreamSourceRow,
  isUsenet: boolean,
): StreamCandidate[] {
  const items: StreamCandidate[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1]!;
    const title = pickTag(block, "title") ?? "";
    const link = pickTag(block, "link") ?? "";
    const guid = pickTag(block, "guid") ?? link;
    const description = pickTag(block, "description") ?? "";
    const attrs = pickAttrs(block);
    // The NZB download URL lives in <enclosure type="application/x-nzb" url="…"/>.
    // Many indexers (Prowlarr/Jackett-via-Newznab) leave <link> empty or use it
    // as a details-page URL, so the enclosure is the authoritative source for
    // the actual downloadable NZB.
    const enclosure = pickEnclosure(block);
    const nzbUrl = enclosure?.type === "application/x-nzb" ? enclosure.url : (enclosure?.url ?? link);
    const infoHash = (attrs.get("infohash") ?? attrs.get("infoHash"))?.toLowerCase() ?? undefined;
    const seedersStr = attrs.get("seeders");
    const enclosureSize = enclosure?.length;
    const sizeStr = attrs.get("size") ?? pickTag(block, "size") ?? enclosureSize ?? undefined;
    const seeders = seedersStr ? parseInt(seedersStr, 10) : undefined;
    const sizeBytes = sizeStr ? parseInt(sizeStr, 10) : undefined;
    if (!link && !infoHash && !nzbUrl) continue;

    if (isUsenet) {
      if (!nzbUrl) continue;
      items.push({
        id: candidateId(row.id, guid || nzbUrl),
        sourceType: row.source_type,
        sourceId: row.id,
        name: row.name,
        description: description || title,
        rawTitle: title,
        nzbId: nzbUrl, // NZB download URL — usenet resolvers fetch + submit this.
        sizeBytes,
        meta: { guid },
      });
    } else if (infoHash) {
      items.push({
        id: candidateId(row.id, infoHash),
        sourceType: row.source_type,
        sourceId: row.id,
        name: row.name,
        description: description || title,
        rawTitle: title,
        infoHash,
        sizeBytes,
        seeders,
        meta: { guid, magnetLink: link.startsWith("magnet:") ? link : undefined },
      });
    }
  }
  return items;
}

function pickTag(block: string, tag: string): string | undefined {
  // Strip optional CDATA wrappers. Some indexers wrap titles in <![CDATA[...]]>.
  const r = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(r);
  if (!m) return undefined;
  return m[1]!.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function pickAttrs(block: string): Map<string, string> {
  // <torznab:attr name="x" value="y"/>
  const out = new Map<string, string>();
  const r = /<(?:torznab|newznab):attr\s+name="([^"]+)"\s+value="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = r.exec(block)) !== null) {
    out.set(m[1]!.toLowerCase(), m[2]!);
  }
  return out;
}

function pickEnclosure(block: string): { url: string; length?: string; type?: string } | null {
  // <enclosure url="…" length="…" type="application/x-nzb"/>. Attribute order
  // varies across indexers so we match each attribute independently.
  const m = /<enclosure\s+([^>]*?)\/?>/i.exec(block);
  if (!m) return null;
  const tag = m[1]!;
  const url = /\burl="([^"]*)"/i.exec(tag)?.[1];
  if (!url) return null;
  const length = /\blength="([^"]*)"/i.exec(tag)?.[1];
  const type = /\btype="([^"]*)"/i.exec(tag)?.[1];
  return { url, length, type };
}
