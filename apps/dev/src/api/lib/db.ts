import { createDbClient, type DbAdapter } from "@voyantjs/db"

/**
 * Database client helpers with NO schema passing.
 * Queries import table definitions directly for optimal tree-shaking.
 * All data is in a single EU database - no multi-region routing needed.
 */

export function getDb(adapter?: DbAdapter) {
  const url = process.env.DATABASE_URL ?? ""
  const effectiveAdapter = adapter || (process.env.DB_ADAPTER as DbAdapter) || "edge"
  return createDbClient(url, { adapter: effectiveAdapter })
}

export function getDbFromEnv(env: CloudflareBindings, adapter?: DbAdapter) {
  const url = env.DATABASE_URL
  const effectiveAdapter = adapter || "edge"
  return createDbClient(url, { adapter: effectiveAdapter })
}

/**
 * Get database client using Hyperdrive connection pooling.
 * Falls back to regular connection if Hyperdrive is not configured.
 *
 * Hyperdrive provides:
 * - Connection pooling at the edge (no cold connection overhead)
 * - Automatic connection reuse across requests
 * - Lower latency than direct Neon HTTP driver
 *
 * @see https://developers.cloudflare.com/hyperdrive/
 */
export function getDbFromHyperdrive(env: CloudflareBindings) {
  // Prefer Hyperdrive if available (prod)
  if (env.HYPERDRIVE) {
    return createDbClient(env.HYPERDRIVE.connectionString, { adapter: "node" })
  }

  // Dev: direct postgres.js connection to local DATABASE_URL
  if (env.DATABASE_URL) {
    return createDbClient(env.DATABASE_URL, { adapter: "node" })
  }

  throw new Error("[db] No HYPERDRIVE binding or DATABASE_URL configured")
}
