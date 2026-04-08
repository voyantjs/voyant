import { boolean, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product category assignments columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productCategoryAssignmentsTable = pgTable("product_category_assignments", {
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   categoryId: typeIdRef("category_id").notNull().references(...),
 *   ...productCategoryAssignmentsCoreColumns(),
 * })
 */
export function productCategoryAssignmentsCoreColumns() {
  return {
    isPrimary: boolean("is_primary").notNull().default(false),
    source: text("source").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
}
