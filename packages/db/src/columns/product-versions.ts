import { integer, jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product versions columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productVersionsTable = pgTable("product_versions", {
 *   id: typeId("product_versions"),
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   ...productVersionsCoreColumns(),
 * })
 */
export function productVersionsCoreColumns() {
  return {
    versionNo: integer("version_no").notNull(),
    status: text("status").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
}
