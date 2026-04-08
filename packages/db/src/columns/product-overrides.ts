import { jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product overrides columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productOverridesTable = pgTable("product_overrides", {
 *   id: typeId("product_overrides"),
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   ...productOverridesCoreColumns(),
 * })
 */
export function productOverridesCoreColumns() {
  return {
    locale: text("locale"),
    sourceRef: text("source_ref").notNull(),
    fields: jsonb("fields").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}
