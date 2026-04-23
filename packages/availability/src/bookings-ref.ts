import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core"

/**
 * Minimal references to bookings tables so availability service methods can
 * count active reservations per option_unit. No FKs — availability must not
 * take a compile-time dependency on bookings to keep the dependency graph
 * flowing bookings → availability only.
 */
export const bookingsRef = pgTable("bookings", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
})

export const bookingItemsRef = pgTable("booking_items", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  productId: text("product_id"),
  optionId: text("option_id"),
  optionUnitId: text("option_unit_id"),
  quantity: integer("quantity").notNull().default(1),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
})
