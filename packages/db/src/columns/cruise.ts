import { boolean, integer, jsonb, text } from "drizzle-orm/pg-core"

/**
 * Ship cabin core columns - shared between db-main and db-marketplace.
 * Contains individual cabin data.
 */
export function shipCabinCoreColumns() {
  return {
    cabinNumber: text("cabin_number"),
    deck: text("deck"),
    position: text("position"),
    accessible: boolean("accessible"),
    notes: text("notes"),
  }
}

/**
 * Ship cabin category core columns - shared between db-main and db-marketplace.
 * Contains cabin category data.
 * NOTE: Some fields differ between db-main (code, currency, amount, images, marketingCopy)
 * and db-marketplace (codes array, media, legendImage, floorPlanImage, cabinImage, description).
 * Only common fields are included here.
 */
export function shipCabinCategoryCoreColumns() {
  return {
    name: text("name").notNull(),
    maxOccupancy: integer("max_occupancy"),
    features: jsonb("features"),
    deckLocation: text("deck_location"),
    sortOrder: integer("sort_order"),
  }
}
