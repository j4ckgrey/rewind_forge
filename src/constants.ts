/**
 * Shared constants for the streams pipeline.
 */

/**
 * Default user id for single-admin deployments. Matches the admin seed
 * inserted by bootstrapDatabase() in lib/db.ts. When multi-user lands, swap
 * this for the authenticated user's id at the call site.
 */
export const DEFAULT_USER_ID = "user-admin";
