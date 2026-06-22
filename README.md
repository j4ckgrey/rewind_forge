# The Forge — Rewind Addon

The Forge is the **torrent / usenet / debrid** integration for
[Rewind](https://github.com/), packaged as an operator-installed addon. It is
deliberately shipped **separately from the core Rewind server** so the server
itself carries no indexer or debrid-resolution code — you choose to install The
Forge at your own discretion.

When installed, The Forge:

- reveals the **Forge** tab in the Rewind dashboard (indexers, debrid accounts,
  usenet helpers, global stream preferences, the label formatter);
- reveals the **Debrid Providers** and **Self-Hosted Usenet** credential groups
  in the API Keys tab;
- activates the streams pipeline so titles resolve playable streams through your
  configured indexers + debrid/usenet providers.

Uninstalling (or disabling) it hides all of the above and the pipeline goes
dark. AIOStreams / AIOMetadata are a separate, built-in path and are unaffected.

## What it provides

- **Indexers / sources:** Torrentio, Zilean, Torznab/Newznab/NZBHydra, Comet,
  EasyNews, TorBox search, and any external addon manifest.
- **Resolvers:** Real-Debrid, AllDebrid, Premiumize, TorBox, Debrid-Link,
  Offcloud, Put.io, EasyDebrid; NZBDav + AltMount for usenet.

## Installing

1. Host this addon so its `manifest.json` is reachable over HTTP (see
   *Running* below).
2. In the Rewind dashboard go to **Integrations → Addons**.
3. Paste the manifest URL, e.g. `https://github.com/j4ckgrey/rewind_forge/blob/main/manifest.json`, and
   press **Install**.

The Forge tab and the debrid/usenet keys appear immediately.

## Manifest

This addon speaks the **Rewind addon dialect** (Stremio-ish, with a `rewind`
extension block). See [`manifest.json`](./manifest.json). Key fields:

| field | meaning |
| --- | --- |
| `rewind.kind` | `forge` — drives all gating in the server. |
| `rewind.tabs` | dashboard tabs to reveal while installed. |
| `rewind.configKeys` | credential keys to surface in the API Keys tab. |
| `rewind.features` | coarse features the addon activates. |

## Layout

```
the_forge/
  manifest.json     Rewind addon manifest (the install URL points at this)
  src/
    index.ts        public API (everything the embedder imports from @forge)
    host.ts         ForgeHost contract — the only thing the core needs from its host
    log.ts          logger shim (forwards to the host logger)
    types.ts        domain row types (StreamSourceRow/StreamAccountRow/…)
    pipeline.ts     search → parse → filter → cached-check → sort → persist
    sources/        Torrentio, Zilean, Torznab, Comet, EasyNews, TorBox, external-addon
    resolvers/      Real-Debrid, AllDebrid, Premiumize, TorBox, …, NZBDav, AltMount
    parser.ts sort.ts filter.ts formatter.ts constants.ts
```

The core is pure logic: it imports **nothing** from rewind_server. Everything it
needs from its environment (DB access + logger) is the `ForgeHost` interface in
`host.ts`. `src/plugin.ts` is the bundle entry: it exports `register(host)`,
which the server calls once after loading the bundle.

## How it's consumed (runtime plugin — NOT part of the server build)

The Rewind server ships **clean** and runs fine with this addon absent. The
operator installs The Forge at runtime:

1. `npm run build` bundles `src/plugin.ts` + all deps into a single
   `dist/index.mjs` (esbuild).
2. Publish that file (e.g. a GitHub **release asset**); `manifest.json`'s
   `rewind.bundleUrl` points at it.
3. In the Rewind dashboard → **Integrations → Addons**, paste this repo's
   `manifest.json` URL and press **Install**. The server downloads the bundle
   into its persistent data volume at `data/addons/forge/index.mjs` (so it
   **survives Docker image updates**), `import()`s it, and calls `register(host)`
   with its DB + logger. Uninstall deletes the bundle and the install flag.

Because the bundle lives in the data volume and is loaded dynamically, the Forge
is fully optional and the server image never contains its code.

## Develop

```sh
npm install
npm run typecheck
npm test
npm run build      # → dist/index.mjs (publish this as the bundleUrl asset)
```
