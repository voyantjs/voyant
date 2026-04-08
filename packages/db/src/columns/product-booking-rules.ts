import { boolean, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product booking rules columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productBookingRulesTable = pgTable("product_booking_rules", {
 *   id: typeId("product_booking_rules"),
 *   productId: typeIdRef("product_id").notNull().references(...).unique(),
 *   ...productBookingRulesCoreColumns(),
 * })
 */
export function productBookingRulesCoreColumns() {
  return {
    // Group size constraints
    minGroupSize: integer("min_group_size"),
    maxGroupSize: integer("max_group_size"),
    // Age restrictions
    minAge: integer("min_age"),
    maxAge: integer("max_age"),
    childMinAge: integer("child_min_age").default(2),
    childMaxAge: integer("child_max_age").default(12),
    infantMinAge: integer("infant_min_age").default(0),
    infantMaxAge: integer("infant_max_age").default(2),
    // Physical requirements - fitnessLevel added by each table with its own enum
    wheelchairAccessible: boolean("wheelchair_accessible").default(false),
    requiresMobility: text("requires_mobility"),
    // Booking timing constraints
    bookingCutoffHours: integer("booking_cutoff_hours"),
    sameDayBookingAllowed: boolean("same_day_booking_allowed").default(true),
    advancePurchaseMinDays: integer("advance_purchase_min_days"),
    advancePurchaseMaxDays: integer("advance_purchase_max_days"),
    // Geographic restrictions
    allowedCountries: jsonb("allowed_countries").$type<string[]>(),
    restrictedCountries: jsonb("restricted_countries").$type<string[]>(),
    visaRequiredCountries: jsonb("visa_required_countries").$type<string[]>(),
    // Special requirements
    requiresInsurance: boolean("requires_insurance").default(false),
    requiresWaiver: boolean("requires_waiver").default(false),
    requiresMedicalClearance: boolean("requires_medical_clearance").default(false),
    // Booking window
    bookingWindowStartDays: integer("booking_window_start_days"),
    bookingWindowEndDays: integer("booking_window_end_days"),
    // Custom restrictions
    customRestrictions:
      jsonb("custom_restrictions").$type<
        {
          key: string
          description: string
          validationRule?: string
        }[]
      >(),
    // Validation messages
    validationMessages: jsonb("validation_messages").$type<Record<string, string>>(),
    // Active flag
    active: boolean("active").notNull().default(true),
    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
}
