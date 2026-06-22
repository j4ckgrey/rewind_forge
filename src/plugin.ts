/**
 * The Forge — runtime plugin entry.
 *
 * This is the bundle entry point. `npm run build` (esbuild) bundles this file +
 * all its imports + deps into a single self-contained `dist/index.mjs`, which the
 * operator installs into the Rewind server's data volume at
 * data/addons/forge/index.mjs. The server dynamically imports it and calls
 * `register(host)` once, handing over its DB/logger as the ForgeHost.
 *
 * `register` returns the server-facing API (a thin facade over the pipeline that
 * takes the raw prefs row + formatter JSON, so the server contract stays small).
 */
import { setForgeHost, type ForgeHost } from "@forge/host";
import { syncNativeStreams as pipelineSync, resolveStream } from "@forge/pipeline";
import { parseStreamPrefs } from "@forge/filter";
import { parseFormatterConfig } from "@forge/formatter";
import type { StreamQuery, StreamPreferencesRow } from "@forge/types";

export const manifest = { id: "rewind.forge", kind: "forge" as const };

export function register(host: ForgeHost) {
  setForgeHost(host);
  return {
    syncNativeStreams(opts: {
      itemId: string;
      query: StreamQuery;
      prefsRow: StreamPreferencesRow;
      preferredReleaseGroup?: string | null;
      formatterJson?: string | null;
      episodeName?: string | null;
    }) {
      return pipelineSync({
        itemId: opts.itemId,
        query: opts.query,
        prefs: parseStreamPrefs(opts.prefsRow),
        preferredReleaseGroup: opts.preferredReleaseGroup ?? null,
        formatter: parseFormatterConfig(
          opts.formatterJson ? JSON.parse(opts.formatterJson) : null,
        ),
        episodeName: opts.episodeName ?? null,
      });
    },
    resolveStream,
  };
}
