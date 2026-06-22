/**
 * The Forge — public API.
 *
 * Everything the embedder (rewind_server today; a standalone service in Phase 5)
 * needs is re-exported here, so consumers import from `@forge` rather than
 * reaching into individual files. The host contract (`setForgeHost`) must be
 * satisfied once at startup before the pipeline is used.
 */

// Host contract + domain types
export * from "@forge/host";
export * from "@forge/types";

// Pipeline entry points
export { syncNativeStreams, resolveStream } from "@forge/pipeline";

// Sources (registry + the two referenced directly by rewind_server)
export {
  buildSource,
  SOURCE_TYPES,
  CometSource,
  EasyNewsSource,
  ExternalAddonSource,
  TorBoxSearchSource,
  TorrentioSource,
  TorznabSource,
  ZileanSource,
} from "@forge/sources";
export { describeFetchFailure, redactUrl, candidateId, fetchJson } from "@forge/sources/base";

// Resolvers (registry + the one referenced directly by rewind_server/adult)
export { buildResolver, prettyProvider, providerTag } from "@forge/resolvers";
export { TorBoxResolver } from "@forge/resolvers/torbox";

// Parsing / filtering / sorting / formatting
export { parseCandidate, parseReleaseName } from "@forge/parser";
export {
  parseStreamPrefs,
  applyFilters,
  applyAvailabilityFilters,
  applySeasonEpisodeGate,
} from "@forge/filter";
export { pinReleaseGroup, sortStreams } from "@forge/sort";
export {
  DEFAULT_FORMATTER_CONFIG,
  PRESETS,
  listCategoryStyles,
  parseFormatterConfig,
  formatStream,
  type FormatterConfig,
} from "@forge/formatter";

// Constants
export { DEFAULT_USER_ID } from "@forge/constants";
