/**
 * Resolver registry — central map from provider id to factory.
 *
 * Adding a new resolver: implement Resolver in a new file under this folder,
 * then register it here. The pipeline never imports adapters directly; it
 * always goes through `buildResolver(row)`.
 */
import type { StreamAccountRow } from "@forge/types";
import type { Resolver } from "../types";
import { AllDebridResolver } from "./alldebrid";
import { AltMountResolver } from "./altmount";
import { DebridLinkResolver } from "./debridlink";
import { EasyDebridResolver } from "./easydebrid";
import { NzbDavResolver } from "./nzbdav";
import { OffcloudResolver } from "./offcloud";
import { PremiumizeResolver } from "./premiumize";
import { PutioResolver } from "./putio";
import { RealDebridResolver } from "./realdebrid";
import { TorBoxResolver } from "./torbox";

const FACTORIES: Record<string, (row: StreamAccountRow) => Resolver> = {
  realdebrid: (row) => new RealDebridResolver(row),
  alldebrid: (row) => new AllDebridResolver(row),
  premiumize: (row) => new PremiumizeResolver(row),
  torbox: (row) => new TorBoxResolver(row),
  easydebrid: (row) => new EasyDebridResolver(row),
  debridlink: (row) => new DebridLinkResolver(row),
  offcloud: (row) => new OffcloudResolver(row),
  putio: (row) => new PutioResolver(row),
  nzbdav: (row) => new NzbDavResolver(row),
  altmount: (row) => new AltMountResolver(row),
};

export function buildResolver(row: StreamAccountRow): Resolver | null {
  const factory = FACTORIES[row.provider];
  return factory ? factory(row) : null;
}

export const RESOLVER_PROVIDERS = Object.keys(FACTORIES);

export const DEBRID_PROVIDERS = [
  "realdebrid", "alldebrid", "premiumize", "torbox",
  "easydebrid", "debridlink", "offcloud", "putio",
] as const;

export const USENET_PROVIDERS = ["torbox", "nzbdav", "altmount"] as const;

// Human display names + short tags for log lines and the stream-picker label.
// Falls back to a capitalised provider id for anything not listed here.
const PROVIDER_NAMES: Record<string, string> = {
  realdebrid: "Real-Debrid",
  alldebrid: "AllDebrid",
  premiumize: "Premiumize",
  torbox: "TorBox",
  easydebrid: "EasyDebrid",
  debridlink: "DebridLink",
  offcloud: "Offcloud",
  putio: "put.io",
  nzbdav: "NZBDav",
  altmount: "AltMount",
};

const PROVIDER_TAGS: Record<string, string> = {
  realdebrid: "RD",
  alldebrid: "AD",
  premiumize: "PM",
  torbox: "TB",
  easydebrid: "ED",
  debridlink: "DL",
  offcloud: "OC",
  putio: "PIO",
  nzbdav: "NZB",
  altmount: "ALT",
};

/** Full display name for a provider id, e.g. "realdebrid" → "Real-Debrid". */
export function prettyProvider(provider: string): string {
  return (
    PROVIDER_NAMES[provider] ??
    provider.charAt(0).toUpperCase() + provider.slice(1)
  );
}

/** Short tag for compact labels, e.g. "realdebrid" → "RD" (Stremio-style). */
export function providerTag(provider: string): string {
  return PROVIDER_TAGS[provider] ?? provider.slice(0, 3).toUpperCase();
}

export {
  AllDebridResolver, AltMountResolver, DebridLinkResolver, EasyDebridResolver,
  NzbDavResolver, OffcloudResolver, PremiumizeResolver, PutioResolver,
  RealDebridResolver, TorBoxResolver,
};
