import { boolean, integer, jsonb, numeric, text, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Pricing-related columns shared between db-main and db-marketplace
 */

/**
 * Core columns for product_base_prices table
 */
export function productBasePricesCoreColumns() {
  return {
    currency: varchar("currency", { length: 3 }).notNull(),
    pricingModel: text("pricing_model").notNull(),
    priceVector: jsonb("price_vector").notNull(),
    taxesFees: jsonb("taxes_fees"),
    taxOverrideEnabled: boolean("tax_override_enabled").notNull().default(false),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    version: integer("version").notNull().default(1),
  }
}

/**
 * Core columns for product_departure_price_overrides table
 */
export function productDeparturePriceOverridesCoreColumns() {
  return {
    mode: text("mode").notNull(),
    priceVector: jsonb("price_vector").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
}

/**
 * Core columns for price_schedules table
 */
export function priceSchedulesCoreColumns() {
  return {
    currency: text("currency").notNull(),
    occupancy: integer("occupancy").notNull(),
    baseAmount: numeric("base_amount").notNull(),
    singleSupplement: numeric("single_supplement"),
    childReduction: numeric("child_reduction"),
    taxesFees: jsonb("taxes_fees"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    version: integer("version").notNull(),
  }
}

/**
 * Core columns for rate_plans table
 */
export function ratePlansCoreColumns() {
  return {
    name: text("name").notNull(),
    code: text("code"),
    terms: jsonb("terms"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
}

/**
 * Core columns for product_payment_overrides table
 */
export function productPaymentOverridesCoreColumns() {
  return {
    locale: text("locale"),
    settings: jsonb("settings").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}
