import { sql } from "drizzle-orm"
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  smallint,
  text,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

/**
 * Itinerary sub-table columns shared between db-main and db-marketplace
 */

/**
 * Core columns for itinerary_versions table
 */
export function itineraryVersionsCoreColumns() {
  return {
    versionNo: integer("version_no").notNull(),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Core columns for itinerary_days table
 */
export function itineraryDaysCoreColumns() {
  return {
    dayNo: integer("day_no").notNull(),
    title: text("title"),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    startTime: time("start_time"),
    endTime: time("end_time"),
    attributes: jsonb("attributes").notNull().default({}),
    timezone: text("timezone"),
    locationName: text("location_name"),
    locationAddress: text("location_address"),
    locationPlaceId: text("location_place_id"),
    locationLat: doublePrecision("location_lat"),
    locationLng: doublePrecision("location_lng"),
    gallery: jsonb("gallery").notNull().default([]),
  }
}

/**
 * Core columns for itinerary_segments table
 */
export function itinerarySegmentsCoreColumns() {
  return {
    sort: integer("sort").notNull().default(0),
    title: text("title"),
    description: text("description"),
    startTime: time("start_time"),
    endTime: time("end_time"),
    media: jsonb("media").notNull().default([]),
    logicalKey: text("logical_key").notNull().default(sql`gen_random_uuid()::text`),
    type: text("type"),
    allDay: boolean("all_day").notNull().default(false),
    isOptional: boolean("is_optional").notNull().default(false),
    timezone: text("timezone"),
    locationName: text("location_name"),
    locationAddress: text("location_address"),
    locationPlaceId: text("location_place_id"),
    locationLat: doublePrecision("location_lat"),
    locationLng: doublePrecision("location_lng"),
    providerKind: text("provider_kind").notNull().default("custom"),
    providerCustom: jsonb("provider_custom"),
    providerIntegrationKey: text("provider_integration_key"),
    providerIntegrationRef: jsonb("provider_integration_ref"),
    externalRef: jsonb("external_ref"),
    costSource: text("cost_source").notNull().default("manual"),
    costCurrency: varchar("cost_currency", { length: 3 }).notNull().default("USD"),
    costBasis: text("cost_basis").notNull().default("group"),
    costAmountMinor: integer("cost_amount_minor").notNull().default(0),
    costTaxIncluded: boolean("cost_tax_included").notNull().default(true),
    costTaxes: jsonb("cost_taxes"),
    costFees: jsonb("cost_fees"),
    costTiers: jsonb("cost_tiers"),
    contractRateRef: jsonb("contract_rate_ref"),
    providerQuoteRef: jsonb("provider_quote_ref"),
    recurrenceKind: text("recurrence_kind").notNull().default("none"),
    recurrenceInterval: integer("recurrence_interval").notNull().default(1),
    recurrenceStartDayIndex: integer("recurrence_start_day_index"),
    recurrenceEndDayIndex: integer("recurrence_end_day_index"),
    recurrenceByWeekday: smallint("recurrence_by_weekday").array(),
    recurrenceCustomDayIndices: integer("recurrence_custom_day_indices").array(),
    recurrenceExceptions: integer("recurrence_exceptions").array(),
    isRecurrenceMaster: boolean("is_recurrence_master").notNull().default(false),
    inventoryManaged: boolean("inventory_managed"),
  }
}

/**
 * Core columns for itinerary_translations table
 */
export function itineraryTranslationsCoreColumns() {
  return {
    locale: text("locale").notNull(),
    title: text("title"),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Core columns for itinerary_day_translations table
 */
export function itineraryDayTranslationsCoreColumns() {
  return {
    locale: text("locale").notNull(),
    title: text("title"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Core columns for itinerary_segment_translations table
 */
export function itinerarySegmentTranslationsCoreColumns() {
  return {
    locale: text("locale").notNull(),
    title: text("title"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}
