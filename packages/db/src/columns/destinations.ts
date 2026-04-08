import { doublePrecision, jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Destination-related columns shared between db-main and db-marketplace
 */

/**
 * Core columns for destinations table
 */
export function destinationsCoreColumns() {
  return {
    googlePlaceId: text("google_place_id").notNull(),
    formattedAddress: text("formatted_address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    heroMedia: jsonb("hero_media"),
    seo: jsonb("seo").notNull().default({}),
    widgets: jsonb("widgets").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}
