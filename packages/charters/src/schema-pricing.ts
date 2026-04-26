import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { charterVoyages } from "./schema-core.js"
import { suiteAvailabilityEnum, suiteCategoryEnum } from "./schema-shared.js"

/**
 * Per-suite pricing on a voyage. Charter pricing is flat — one row per suite
 * per voyage, no occupancy variants and no fare codes (unlike cruises). The
 * four explicit currency columns let SQL filter and order by price natively;
 * tertiary currencies handle via FX at display time.
 */
export const charterSuites = pgTable(
  "charter_suites",
  {
    id: typeId("charter_suites"),
    voyageId: typeIdRef("voyage_id")
      .notNull()
      .references(() => charterVoyages.id, { onDelete: "cascade" }),
    suiteCode: text("suite_code").notNull(),
    suiteName: text("suite_name").notNull(),
    suiteCategory: suiteCategoryEnum("suite_category"),
    description: text("description"),
    squareFeet: numeric("square_feet", { precision: 8, scale: 2 }),
    images: jsonb("images").$type<string[]>().default([]),
    floorplanImages: jsonb("floorplan_images").$type<string[]>().default([]),
    /** Used at booking time to validate party size; not used for pricing math. */
    maxGuests: smallint("max_guests"),

    // Multi-currency flat pricing
    priceUSD: numeric("price_usd", { precision: 12, scale: 2 }),
    priceEUR: numeric("price_eur", { precision: 12, scale: 2 }),
    priceGBP: numeric("price_gbp", { precision: 12, scale: 2 }),
    priceAUD: numeric("price_aud", { precision: 12, scale: 2 }),

    // Optional per-currency port fees (separate from price)
    portFeeUSD: numeric("port_fee_usd", { precision: 12, scale: 2 }),
    portFeeEUR: numeric("port_fee_eur", { precision: 12, scale: 2 }),
    portFeeGBP: numeric("port_fee_gbp", { precision: 12, scale: 2 }),
    portFeeAUD: numeric("port_fee_aud", { precision: 12, scale: 2 }),

    availability: suiteAvailabilityEnum("availability").notNull().default("available"),
    unitsAvailable: smallint("units_available"),
    appointmentOnly: boolean("appointment_only").notNull().default(false),
    notes: text("notes"),

    /** Per-brand quirks that don't fit the canonical schema. */
    extra: jsonb("extra").$type<Record<string, unknown>>().default({}),
    externalRefs: jsonb("external_refs").$type<Record<string, string>>().default({}),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uidx_charter_suites_voyage_code").on(table.voyageId, table.suiteCode),
    index("idx_charter_suites_voyage_availability").on(table.voyageId, table.availability),
    index("idx_charter_suites_voyage_cat_price").on(
      table.voyageId,
      table.suiteCategory,
      table.priceUSD,
    ),
  ],
)

export type CharterSuite = typeof charterSuites.$inferSelect
export type NewCharterSuite = typeof charterSuites.$inferInsert
