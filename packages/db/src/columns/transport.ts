import { boolean, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Transport configs core columns - shared between db-main and db-marketplace.
 * Contains common transport configuration data.
 */
export function transportConfigsCoreColumns() {
  return {
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Transport config legs core columns - shared between db-main and db-marketplace.
 * Contains transport segment configuration data.
 */
export function transportConfigLegsCoreColumns() {
  return {
    seq: integer("seq").notNull().default(1),
    modeKey: text("mode_key"),
    airlineCode: text("airline_code"),
    fromPlaceId: text("from_place_id"),
    toPlaceId: text("to_place_id"),
    cabinClass: text("cabin_class"),
    fareClassCode: text("fare_class_code"),
    durationMinutes: integer("duration_minutes"),
    luggage: text("luggage").notNull().default("{}"),
    flightNumber: text("flight_number"),
  }
}

/**
 * Transport addons core columns - shared between db-main and db-marketplace.
 * Contains transport addon data.
 */
export function transportAddonsCoreColumns() {
  return {
    name: text("name").notNull(),
    pricing: text("pricing").notNull(),
    required: boolean("required").default(false),
    selectable: boolean("selectable").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Transport fare classes core columns - shared between db-main and db-marketplace.
 * Contains fare class reference data.
 */
export function transportFareClassesCoreColumns() {
  return {
    code: text("code").notNull(),
    name: text("name").notNull(),
    refundability: text("refundability"),
    changeRules: jsonb("change_rules"),
    combinability: jsonb("combinability"),
    baggage: jsonb("baggage"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
}
