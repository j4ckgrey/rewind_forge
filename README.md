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
3. Paste the manifest URL, e.g. `https://forge.example.com/manifest.json`, and
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
`host.ts`, which the embedder registers once via `setForgeHost()`.

## Consuming it

- **In-process (current):** rewind_server source-imports this repo via the
  `@forge` path alias (tsconfig `paths` + Next `experimental.externalDir`) and
  registers a `ForgeHost` backed by its own SQLite (see
  `rewind_server/src/lib/forgeHost.ts`). The Docker build context must include
  this directory (build from the workspace root, or vendor it as a git
  submodule). For local dev, `the_forge/node_modules` is symlinked to
  rewind_server's install so the Forge's own deps resolve.
- **Standalone (Phase 5):** wrap `src/index.ts` in a thin HTTP server that
  serves `/manifest.json` + the stream protocol, register a `ForgeHost` backed by
  its own storage, and run it as its own container.

## Develop

```sh
npm install
npm run typecheck
npm test
```
# rewind_forge
