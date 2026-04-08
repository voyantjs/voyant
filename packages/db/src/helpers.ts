// /packages/db/src/helpers.ts

import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import type { AnyPgTable } from "drizzle-orm/pg-core"
import { z } from "zod"

/**
 * Zod schema for boolean query parameters.
 *
 * `z.coerce.boolean()` is broken for query strings: `"false"` coerces to
 * `Boolean("false")` → `true`. This schema correctly handles `"true"` and
 * `"false"` string values from URL search params.
 */
export const booleanQueryParam = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1")

/**
 * A more readable alias for Drizzle's InferSelectModel.
 */
export type SelectModel<T extends AnyPgTable> = InferSelectModel<T>

/**
 * A more readable alias for Drizzle's InferInsertModel.
 */
export type InsertModel<T extends AnyPgTable> = InferInsertModel<T>

/**
 * A simple type guard to check if an error is an instance of Error.
 */
export function isDatabaseError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Wraps a Drizzle query promise to provide consistent error logging.
 * Use this for critical operations that should throw an error on failure.
 *
 * @example
 * const user = await executeQuery(db.query.users.findFirst());
 */
export async function executeQuery<T>(query: Promise<T>): Promise<T> {
  try {
    return await query
  } catch (error) {
    if (isDatabaseError(error)) {
      console.error("Database query error:", error.message)
    }
    // Re-throw the error to be handled by the caller
    throw error
  }
}

/**
 * Wraps a database operation in a try/catch block.
 * Returns the result on success or a fallback value (defaulting to null) on error.
 * Use this for non-critical operations that should not crash the application.
 *
 * @example
 * await safeDbOperation(() => db.insert(logs).values({ message: 'User logged in' }));
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback?: T,
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    if (isDatabaseError(error)) {
      console.error("Database operation error:", error.message)
    }
    return fallback ?? null
  }
}
