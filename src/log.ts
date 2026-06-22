/**
 * Forge logger shim.
 *
 * Re-exports a `logger` with the same surface the Forge code already calls
 * (`logger.info("streams", msg)` etc.). It forwards to the host-provided logger
 * once a host is registered, and falls back to console before that (and in
 * standalone/test contexts). This keeps every call site unchanged while the
 * Forge stays free of any direct dependency on rewind_server's logger.
 */
import { getForgeHost, hasForgeHost, type ForgeLogger } from "@forge/host";

const consoleLogger: ForgeLogger = {
  info: (c, m) => console.log(`[${c}] ${m}`),
  success: (c, m) => console.log(`[${c}] ${m}`),
  warn: (c, m) => console.warn(`[${c}] ${m}`),
  error: (c, m, e) => console.error(`[${c}] ${m}`, e ?? ""),
};

function sink(): ForgeLogger {
  return hasForgeHost() ? getForgeHost().logger : consoleLogger;
}

export const logger: ForgeLogger = {
  info: (c, m) => sink().info(c, m),
  success: (c, m) => sink().success(c, m),
  warn: (c, m) => sink().warn(c, m),
  error: (c, m, e) => sink().error(c, m, e),
};
