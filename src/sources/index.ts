/**
 * Source registry — central map from `source_type` string to factory.
 *
 * Adding a new source: implement StreamSource in a new file under this
 * folder, then add it here. The pipeline never imports the adapters directly;
 * it always goes through `buildSource(row)`.
 */
import type { StreamSourceRow } from "@forge/types";
import type { StreamSource } from "../types";
import { CometSource } from "./comet";
import { EasyNewsSource } from "./easynews";
import { ExternalAddonSource } from "./external-addon";
import { TorBoxSearchSource } from "./torbox-search";
import { TorrentioSource } from "./torrentio";
import { TorznabSource } from "./torznab";
import { ZileanSource } from "./zilean";

const FACTORIES: Record<string, (row: StreamSourceRow) => StreamSource> = {
  torrentio: (row) => new TorrentioSource(row),
  torznab: (row) => new TorznabSource(row),
  newznab: (row) => new TorznabSource(row),
  nzbhydra: (row) => new TorznabSource(row),
  zilean: (row) => new ZileanSource(row),
  comet: (row) => new CometSource(row),
  easynews: (row) => new EasyNewsSource(row),
  "torbox-search": (row) => new TorBoxSearchSource(row),
  "external-addon": (row) => new ExternalAddonSource(row),
};

export function buildSource(row: StreamSourceRow): StreamSource | null {
  const factory = FACTORIES[row.source_type];
  return factory ? factory(row) : null;
}

/** Source types the admin can pick from when adding a new source. */
export const SOURCE_TYPES = Object.keys(FACTORIES);

export {
  CometSource,
  EasyNewsSource,
  ExternalAddonSource,
  TorBoxSearchSource,
  TorrentioSource,
  TorznabSource,
  ZileanSource,
};
