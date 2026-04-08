import { sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { createDbClient } from "./index.js"

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://test:test@localhost:5433/voyant_test"

type PostgresJsDatabaseWithClient = PostgresJsDatabase & {
  $client?: {
    end?: (options?: { timeout?: number | null }) => Promise<unknown>
  }
}

let testDbSingleton: PostgresJsDatabaseWithClient | null = null

/**
 * Creates a database client connected to the test database.
 * Requires the test Postgres instance from `docker-compose.test.yml`.
 *
 * Always uses the Node.js adapter (postgres.js) since tests run in Node.
 */
export function createTestDb(): PostgresJsDatabase {
  if (!testDbSingleton) {
    testDbSingleton = createDbClient(TEST_DB_URL, {
      adapter: "node",
      nodeMaxConnections: 1,
    }) as PostgresJsDatabaseWithClient
  }

  return testDbSingleton
}

/**
 * Closes the shared test database client for the current process.
 */
export async function closeTestDb(): Promise<void> {
  const db = testDbSingleton
  testDbSingleton = null

  await db?.$client?.end?.({ timeout: 0 })
}

/**
 * Truncates all non-system tables in the test database.
 */
export async function cleanupTestDb(db: PostgresJsDatabase): Promise<void> {
  const result = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  )

  const tables = result as unknown as { tablename: string }[]
  if (tables.length > 0) {
    const names = tables.map((r) => `"${r.tablename}"`).join(", ")
    await db.execute(sql.raw(`TRUNCATE ${names} CASCADE`))
  }
}
