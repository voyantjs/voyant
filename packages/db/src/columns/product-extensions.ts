import { boolean, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product extensions columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productExtensionsTable = pgTable("product_extensions", {
 *   id: typeId("product_extensions"),
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   refProductId: typeIdRef("ref_product_id").notNull().references(...),
 *   ...productExtensionsCoreColumns(),
 * })
 */
export function productExtensionsCoreColumns() {
  return {
    position: text("position").notNull(),
    label: text("label"),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    constraints: jsonb("constraints"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    refSource: text("ref_source"),
  }
}
