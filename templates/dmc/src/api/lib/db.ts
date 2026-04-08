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
  // Prefer Hyperdrive if available
  if (env.HYPERDRIVE) {
    // Hyperdrive provides a pooled connection string for use with postgres.js
    return createDbClient(env.HYPERDRIVE.connectionString, { adapter: "node" })
  }

  // Fallback to regular edge adapter if Hyperdrive is not configured
  console.warn("[db] Hyperdrive not configured, falling back to edge adapter")
  return getDbFromEnv(env)
}
