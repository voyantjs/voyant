import { integer, jsonb, timestamp } from "drizzle-orm/pg-core"

/**
 * Core departure columns shared between db-main.catalog.departures
 * and db-marketplace.marketplace.publication_departures.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const departuresTable = pgTable("departures", {
 *   id: typeId("departures"),
 *   productId: typeIdRef("product_id"),
 *   ...departureCoreColumns(),
 *   // Add table-specific columns...
 * })
 */
export function departureCoreColumns() {
  return {
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    capacity: integer("capacity"),
    attributes: jsonb("attributes").notNull().default("{}"),
  }
}
