import { text } from "drizzle-orm/pg-core"

/**
 * Core itinerary columns shared between db-main.catalog.itineraries
 * and db-marketplace.marketplace.publication_itineraries.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const itinerariesTable = pgTable("itineraries", {
 *   id: typeId("itineraries"),
 *   productId: typeIdRef("product_id"),
 *   ...itineraryCoreColumns(),
 *   // Add table-specific columns...
 * })
 */
export function itineraryCoreColumns() {
  return {
    name: text("name").notNull(),
  }
}
