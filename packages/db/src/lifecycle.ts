import { getTableColumns, isNull, type SQL } from "drizzle-orm"
import type { AnyPgTable, PgColumn } from "drizzle-orm/pg-core"

/**
 * Returns true when the table declares a `deletedAt` column.
 *
 * Use this to branch in code paths that need to know whether a soft-delete
 * filter applies (e.g. when composing dynamic WHERE clauses).
 */
export function hasSoftDelete(table: AnyPgTable): boolean {
  const columns = getTableColumns(table) as Record<string, PgColumn>
  return Boolean(columns.deletedAt)
}

/**
 * Returns a `deletedAt IS NULL` predicate for tables that declare a
 * `deletedAt` column. Returns `undefined` for tables without one, so callers
 * can compose the result with `and(...)` without conditional branching:
 *
 * ```ts
 * await db.select().from(bookings).where(and(eq(bookings.id, id), whereActive(bookings)))
 * ```
 *
 * The naming is "active" rather than "not deleted" because the predicate
 * filters to the active (non-tombstoned) rows. `and(undefined, x)` collapses
 * to `x` in drizzle, so the helper is safe to apply unconditionally.
 */
export function whereActive(table: AnyPgTable): SQL | undefined {
  const columns = getTableColumns(table) as Record<string, PgColumn>
  const deletedAt = columns.deletedAt
  return deletedAt ? isNull(deletedAt) : undefined
}
