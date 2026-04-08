import { boolean, integer, jsonb, text, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Offer-related columns shared between db-main and db-marketplace
 *
 * Offers are automatic discounts displayed as strikethrough pricing.
 * Unlike promotions which require codes, offers auto-apply and display to all customers.
 */

/**
 * Core columns for offers table
 */
export function offerCoreColumns() {
  return {
    // Display information
    name: text("name").notNull(),
    description: text("description"),
    badge: text("badge"), // e.g., "SALE", "LIMITED TIME", "EARLY BIRD"

    // Discount configuration (percentage or fixed_amount, consistent with promotions)
    discountType: text("discount_type").notNull().default("percentage"), // "percentage" | "fixed_amount"
    discountValue: varchar("discount_value", { length: 50 }).notNull(), // Value as string for decimal precision
    currency: varchar("currency", { length: 3 }), // Only required for fixed_amount

    // Targeting (arrays for multiple products/departures/room specs)
    applicableProductIds: jsonb("applicable_product_ids"), // string[]
    applicableDepartureIds: jsonb("applicable_departure_ids"), // string[]
    applicableRoomSpecIds: jsonb("applicable_room_spec_ids"), // string[] - for room-level targeting within products

    // Validity period
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validTo: timestamp("valid_to", { withTimezone: true }),

    // Full conditions (JSONB for flexibility)
    // Supports: booking_window, min_pax, customer_segment, channel, booking_date
    conditions: jsonb("conditions").default({}),

    // Stacking with promotions
    stackable: boolean("stackable").notNull().default(false),
    stackingGroup: text("stacking_group"),
    priority: integer("priority").notNull().default(100), // Higher = applied first

    // Display controls
    isActive: boolean("is_active").notNull().default(true),
    displayPriority: integer("display_priority").notNull().default(0), // Higher = shown first in list

    // Audit timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
}
