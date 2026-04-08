import { integer, numeric, text, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Core product availability columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productAvailabilityTable = pgTable("product_availability", {
 *   id: typeId("product_availability"),
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   ...productAvailabilityCoreColumns(),
 * })
 */
export function productAvailabilityCoreColumns() {
  return {
    date: text("date").notNull(),
    slotKey: text("slot_key"),
    capacityTotal: integer("capacity_total"),
    capacityAvailable: integer("capacity_available"),
    priceHint: numeric("price_hint", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}
