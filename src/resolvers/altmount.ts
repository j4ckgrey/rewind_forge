/**
 * AltMount resolver — alternative usenet streaming proxy.
 *
 * AltMount uses the same protocol shape as NZBDav (SABnzbd-compatible submit
 * + poll + WebDAV stream), but at slightly different paths:
 *   - SABnzbd API:  ${host}/sabnzbd/api
 *   - WebDAV root:  ${host}/webdav/<category>/<basename>/…
 *   - Completed-job folder prefix is "/complete" (vs NZBDav's "/content"),
 *     but the public WebDAV mount is "/webdav" — the on-disk path "complete"
 *     is reflected back as a folder under "/webdav" in AltMount's standard
 *     compose recipe.
 *
 * Config blob (stored in `stream_accounts.config_json`):
 *   {
 *     publicHost?: string,
 *     webdavUser?: string,
 *     webdavPassword?: string,
 *     pollIntervalMs?: number,
 *     maxWaitMs?: number,
 *     contentPathPrefix?: string, // default "/webdav"
 *   }
 */
import type { StreamAccountRow } from "@forge/types";
import { NzbDavResolver } from "./nzbdav";

export class AltMountResolver extends NzbDavResolver {
  override readonly provider = "altmount";

  constructor(row: StreamAccountRow) {
    // Default contentPathPrefix to /webdav for AltMount when caller hasn't
    // overridden it. Done by patching config_json before delegating so the
    // base class picks it up.
    let cfg: Record<string, unknown> = {};
    try { cfg = JSON.parse(row.config_json || "{}"); } catch { /* ignore */ }
    if (cfg.contentPathPrefix == null) cfg.contentPathPrefix = "/webdav";
    super({ ...row, config_json: JSON.stringify(cfg) });
  }

  protected override sabApiPath(): string {
    return "/sabnzbd/api";
  }
}
