import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { boolean, date, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Local reference to `pricing.price_schedules`. Hospitality reads this
 * table to resolve per-date rate variations on
 * `hospitalityService.resolveStayDailyRates`, but doesn't pull
 * `@voyantjs/pricing` as a hard dep — the FK rule (intra-domain FKs
 * OK, cross-domain MUST be plain text) means we mirror only the
 * columns we read.
 */
export const priceSchedulesRef = pgTable("price_schedules", {
  id: typeId("price_schedules").primaryKey(),
  priceCatalogId: typeIdRef("price_catalog_id").notNull(),
  code: text("code"),
  name: text("name").notNull(),
  recurrenceRule: text("recurrence_rule").notNull(),
  timezone: text("timezone"),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  weekdays: jsonb("weekdays").$type<string[]>(),
  priority: integer("priority").notNull(),
  active: boolean("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
})
