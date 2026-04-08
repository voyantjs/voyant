import { integer, jsonb, text } from "drizzle-orm/pg-core"

/**
 * Core ship columns shared between db-main.cruise.ships
 * and db-marketplace.marketplace.publication_ships.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const shipsTable = pgTable("ships", {
 *   id: typeId("ships"),
 *   ...shipCoreColumns(),
 *   // Add table-specific columns...
 * })
 */
export function shipCoreColumns() {
  return {
    name: text("name").notNull(),
    description: text("description"),
    yearBuilt: integer("year_built"),
    yearRefurbished: integer("year_refurbished"),
    capacity: integer("capacity"),
    crewSize: integer("crew_size"),
    amenities: jsonb("amenities"),
  }
}
