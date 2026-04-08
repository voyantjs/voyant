import { text, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product visibility columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productVisibilityTable = pgTable("product_visibility", {
 *   id: typeId("product_visibility"),
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   ...productVisibilityCoreColumns(),
 * })
 */
export function productVisibilityCoreColumns() {
  return {
    visibility: text("visibility").notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
}
