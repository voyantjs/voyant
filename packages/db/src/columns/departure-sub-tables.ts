import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  numeric,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

/**
 * Core departure days columns shared between db-main and db-marketplace.
 */
export function departureDaysCoreColumns() {
  return {
    seq: integer("seq").notNull(),
    date: timestamp("date", { withTimezone: true }),
    title: text("title"),
    attributes: jsonb("attributes").notNull().default("{}"),
    status: text("status").notNull().default("planned"),
  }
}

/**
 * Core departure translations columns shared between db-main and db-marketplace.
 */
export function departureTranslationsCoreColumns() {
  return {
    locale: text("locale").notNull(),
    meetingPoint: text("meeting_point"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Core departure rooms columns shared between db-main and db-marketplace.
 * Note: FK references (roomCategoryKey, accommodationProductId, roomTypeId, roomProfileId)
 * must be defined locally in each package.
 */
export function departureRoomsCoreColumns() {
  return {
    capacityTotal: integer("capacity_total").notNull(),
    capacityReserved: integer("capacity_reserved").notNull().default(0),
    capacitySold: integer("capacity_sold").notNull().default(0),
    soldOverride: integer("sold_override"),
    releaseDaysBefore: integer("release_days_before"),
    overbookLimit: integer("overbook_limit").notNull().default(0),
    attributes: jsonb("attributes").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Core departure overrides columns shared between db-main and db-marketplace.
 */
export function departureOverridesCoreColumns() {
  return {
    kind: text("kind").notNull(),
    target: jsonb("target").notNull().default("{}"),
    payload: jsonb("payload").notNull().default("{}"),
    appliedBy: text("applied_by").notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  }
}

/**
 * Core departure room prices columns shared between db-main and db-marketplace.
 * Note: FK references (departureRoomId, ratePlanId) must be defined locally in each package.
 */
export function departureRoomPricesCoreColumns() {
  return {
    currency: varchar("currency", { length: 3 }).notNull(),
    pricingModel: text("pricing_model").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    childAmount: numeric("child_amount", { precision: 12, scale: 2 }),
    extraBedAmount: numeric("extra_bed_amount", { precision: 12, scale: 2 }),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    notes: text("notes"),
  }
}

/**
 * Core departure day tasks columns shared between db-main and db-marketplace.
 * Note: FK references (departureDayId, itineraryItemId) must be defined locally in each package.
 */
export function departureDayTasksCoreColumns() {
  return {
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    startAt: timestamp("start_at", { withTimezone: true }),
    endAt: timestamp("end_at", { withTimezone: true }),
    location: jsonb("location"),
    status: text("status").notNull().default("planned"),
    attributes: jsonb("attributes").notNull().default("{}"),
  }
}

/**
 * Core departure groups columns shared between db-main and db-marketplace.
 */
export function departureGroupsCoreColumns() {
  return {
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"),
    attributes: jsonb("attributes").notNull().default("{}"),
  }
}

/**
 * Core departure group members columns shared between db-main and db-marketplace.
 * Note: FK references (groupId, bookingId, bookingItemId, personId) must be defined locally.
 */
export function departureGroupMembersCoreColumns() {
  return {
    notes: text("notes"),
  }
}

/**
 * Core departure port calls columns shared between db-main and db-marketplace.
 * Note: FK references (departureId, itinerarySegmentId, portId) must be defined locally.
 */
export function departurePortCallsCoreColumns() {
  return {
    seq: integer("seq").notNull(),
    arrivalAt: timestamp("arrival_at", { withTimezone: true }),
    departureAt: timestamp("departure_at", { withTimezone: true }),
    overnight: boolean("overnight").default(false).notNull(),
    notes: text("notes"),
  }
}

/**
 * Core departure transport options columns shared between db-main and db-marketplace.
 * Note: FK references (productId, departureId) must be defined locally.
 */
export function departureTransportOptionsCoreColumns() {
  return {
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    seatsTotal: integer("seats_total"),
    seatsAvailable: integer("seats_available"),
    seatsSold: integer("seats_sold"),
    seatsSoldOverride: integer("seats_sold_override"),
    pricingOverride: jsonb("pricing_override"),
    attributes: jsonb("attributes").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
}

/**
 * Core departure transport segments columns shared between db-main and db-marketplace.
 * Note: FK references (productId, departureId, operatorOrgId, resourceId) must be defined locally.
 */
export function departureTransportSegmentsCoreColumns() {
  return {
    seq: integer("seq").notNull().default(1),
    modeKey: text("mode_key").notNull(),
    fromGooglePlaceId: text("from_google_place_id"),
    fromFormattedAddress: text("from_formatted_address"),
    fromLat: doublePrecision("from_lat"),
    fromLng: doublePrecision("from_lng"),
    toGooglePlaceId: text("to_google_place_id"),
    toFormattedAddress: text("to_formatted_address"),
    toLat: doublePrecision("to_lat"),
    toLng: doublePrecision("to_lng"),
    departOffsetMinutes: integer("depart_offset_minutes"),
    durationMinutes: integer("duration_minutes"),
    attributes: jsonb("attributes").notNull().default({}),
    notes: text("notes"),
    isCharter: boolean("is_charter"),
    airlineCode: text("airline_code"),
    flightNumber: text("flight_number"),
    cabinClass: text("cabin_class"),
    fareClassCode: text("fare_class_code"),
    seatsTotal: integer("seats_total"),
    seatsAvailable: integer("seats_available"),
    luggage: jsonb("luggage"),
  }
}

/**
 * Core departure transport seating columns shared between db-main and db-marketplace.
 * Note: FK references (departureSegmentId, bookingId, bookingItemId, personId) must be defined locally.
 */
export function departureTransportSeatingCoreColumns() {
  return {
    seatLabel: text("seat_label").notNull(),
    seatMeta: jsonb("seat_meta").notNull().default("{}"),
    attributes: jsonb("attributes").notNull().default("{}"),
  }
}

/**
 * Core departure cabin categories columns shared between db-main and db-marketplace.
 * Note: FK references (departureId, shipCabinCategoryId) must be defined locally.
 */
export function departureCabinCategoriesCoreColumns() {
  return {
    inventoryGranularity: text("inventory_granularity")
      .$type<"category" | "cabin">()
      .default("category")
      .notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    allocation: integer("allocation"),
    overbookingLimit: integer("overbooking_limit"),
    sellPriority: integer("sell_priority"),
    cabinsSold: integer("cabins_sold").default(0).notNull(),
    cabinsReserved: integer("cabins_reserved").default(0).notNull(),
    attributes: jsonb("attributes").notNull().default({}),
  }
}

/**
 * Core departure cabins columns shared between db-main and db-marketplace.
 * Note: FK references (departureId, shipCabinId) must be defined locally.
 */
export function departureCabinsCoreColumns() {
  return {
    isAvailable: boolean("is_available").default(true).notNull(),
    allocation: integer("allocation"),
    status: text("status")
      .$type<"available" | "reserved" | "sold" | "blocked">()
      .default("available")
      .notNull(),
    notes: text("notes"),
  }
}
