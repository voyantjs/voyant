import { boolean, jsonb, text } from "drizzle-orm/pg-core"

/**
 * Core product addons columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productAddonsTable = pgTable("product_addons", {
 *   id: typeId("product_addons"),
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   ...productAddonsCoreColumns(),
 * })
 */
export function productAddonsCoreColumns() {
  return {
    name: text("name").notNull(),
    pricing: jsonb("pricing").notNull(),
    required: boolean("required").default(false),
    selectable: boolean("selectable").default(true),
  }
}
