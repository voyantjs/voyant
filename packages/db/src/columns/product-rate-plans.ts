import { boolean, integer, jsonb, text, varchar } from "drizzle-orm/pg-core"

/**
 * Core product rate plan columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productRatePlansTable = pgTable("product_rate_plans", {
 *   id: typeId("product_rate_plans"),
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   ...productRatePlansCoreColumns(),
 * })
 */
export function productRatePlansCoreColumns() {
  return {
    name: text("name").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    pricingModel: text("pricing_model").notNull(),
    paxRules: jsonb("pax_rules").notNull().default("{}"),
    active: boolean("active").default(true),
    priority: integer("priority").notNull().default(100),
  }
}

/**
 * Core product rate plan channels columns shared between db-main and db-marketplace.
 */
export function productRatePlanChannelsCoreColumns() {
  return {
    channel: text("channel").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    status: text("status").notNull().default("active"),
  }
}
