import { boolean, char, date, integer, numeric, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * Room-related columns shared between db-main and db-marketplace
 */

/**
 * Core columns for product_room_specs (room_types) table
 */
export function productRoomSpecsCoreColumns() {
  return {
    code: text("code"),
    name: text("name").notNull(),
    occupancy: text("occupancy").notNull(),
    attributes: text("attributes").notNull().default("{}"),
  }
}

/**
 * Core columns for product_room_listings (room_profiles) table
 */
export function productRoomListingsCoreColumns() {
  return {
    slug: text("slug"),
    title: text("title").notNull(),
    description: text("description"),
    occupancy: text("occupancy")
      .notNull()
      .default('{"adults_min":1,"adults_max":2,"children_max":0}'),
    bedsCount: integer("beds_count"),
    bedConfig: text("bed_config").array().default([]),
    amenities: text("amenities").array().default([]),
    attributes: text("attributes").notNull().default("{}"),
    sort: integer("sort").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Core columns for product_room_listing_media (room_profile_media) table
 */
export function productRoomListingMediaCoreColumns() {
  return {
    url: text("url"),
    kind: text("kind"),
    alt: text("alt"),
    sort: integer("sort").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Core columns for room_prices table
 */
export function roomPricesCoreColumns() {
  return {
    date: date("date").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    priceChild: numeric("price_child", { precision: 12, scale: 2 }),
    extraAdult: numeric("extra_adult", { precision: 12, scale: 2 }),
    minStay: integer("min_stay"),
    closedToArrival: boolean("closed_to_arrival"),
    closedToDeparture: boolean("closed_to_departure"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Core columns for product_room_availability (room_availability) table
 */
export function productRoomAvailabilityCoreColumns() {
  return {
    date: date("date").notNull(),
    roomsTotal: integer("rooms_total"),
    roomsAvailable: integer("rooms_available"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Core columns for product_room_spec_rate_plans (room_rate_plans) table
 */
export function productRoomSpecRatePlansCoreColumns() {
  return {
    name: text("name").notNull(),
    board: text("board"),
    currency: char("currency", { length: 3 }).notNull(),
    cancellationPolicyId: uuid("cancellation_policy_id"),
    restrictions: text("restrictions").default("{}"),
  }
}
