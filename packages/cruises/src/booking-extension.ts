import type { Extension } from "@voyantjs/core"
import { typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { parseJsonBody } from "@voyantjs/hono"
import type { HonoExtension } from "@voyantjs/hono/module"
import { eq } from "drizzle-orm"
import {
  char,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { z } from "zod"

import type { QuoteComponent } from "./service-pricing.js"

// ---------- enums ----------

export const cruiseBookingModeEnum = pgEnum("cruise_booking_mode", ["inquiry", "reserve"])

// ---------- schemas ----------

export const bookingCruiseDetails = pgTable(
  "booking_cruise_details",
  {
    bookingId: text("booking_id").primaryKey(),
    sailingId: typeIdRef("sailing_id").notNull(),
    cabinCategoryId: typeIdRef("cabin_category_id").notNull(),
    cabinId: typeIdRef("cabin_id"),
    occupancy: smallint("occupancy").notNull(),
    fareCode: text("fare_code"),
    mode: cruiseBookingModeEnum("mode").notNull().default("inquiry"),
    quotedPricePerPerson: numeric("quoted_price_per_person", { precision: 12, scale: 2 }).notNull(),
    quotedTotalForCabin: numeric("quoted_total_for_cabin", { precision: 12, scale: 2 }).notNull(),
    quotedCurrency: char("quoted_currency", { length: 3 }).notNull(),
    quotedComponentsJson: jsonb("quoted_components_json").$type<QuoteComponent[]>().default([]),
    connectorBookingRef: text("connector_booking_ref"),
    connectorStatus: text("connector_status"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_bcd_sailing").on(t.sailingId),
    index("idx_bcd_cabin_category").on(t.cabinCategoryId),
    index("idx_bcd_connector_ref").on(t.connectorBookingRef),
  ],
)

export type BookingCruiseDetail = typeof bookingCruiseDetails.$inferSelect
export type NewBookingCruiseDetail = typeof bookingCruiseDetails.$inferInsert

export const bookingGroupCruiseDetails = pgTable(
  "booking_group_cruise_details",
  {
    bookingGroupId: text("booking_group_id").primaryKey(),
    sailingId: typeIdRef("sailing_id").notNull(),
    cabinCount: smallint("cabin_count").notNull(),
    totalQuotedAmount: numeric("total_quoted_amount", { precision: 12, scale: 2 }).notNull(),
    quotedCurrency: char("quoted_currency", { length: 3 }).notNull(),
    connectorBookingRef: text("connector_booking_ref"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_bgcd_sailing").on(t.sailingId),
    index("idx_bgcd_connector_ref").on(t.connectorBookingRef),
  ],
)

export type BookingGroupCruiseDetail = typeof bookingGroupCruiseDetails.$inferSelect
export type NewBookingGroupCruiseDetail = typeof bookingGroupCruiseDetails.$inferInsert

// ---------- validation ----------

const cruiseDetailUpsertSchema = z.object({
  sailingId: z.string(),
  cabinCategoryId: z.string(),
  cabinId: z.string().optional().nullable(),
  occupancy: z.number().int().min(1).max(8),
  fareCode: z.string().optional().nullable(),
  mode: z.enum(["inquiry", "reserve"]).default("inquiry"),
  quotedPricePerPerson: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  quotedTotalForCabin: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  quotedCurrency: z.string().length(3),
  quotedComponentsJson: z.array(z.unknown()).optional().nullable(),
  connectorBookingRef: z.string().optional().nullable(),
  connectorStatus: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const groupCruiseDetailUpsertSchema = z.object({
  sailingId: z.string(),
  cabinCount: z.number().int().min(1).max(20),
  totalQuotedAmount: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  quotedCurrency: z.string().length(3),
  connectorBookingRef: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// ---------- services ----------

export const bookingCruiseDetailsService = {
  async get(db: PostgresJsDatabase, bookingId: string): Promise<BookingCruiseDetail | null> {
    const [row] = await db
      .select()
      .from(bookingCruiseDetails)
      .where(eq(bookingCruiseDetails.bookingId, bookingId))
      .limit(1)
    return row ?? null
  },

  async upsert(
    db: PostgresJsDatabase,
    bookingId: string,
    data: z.infer<typeof cruiseDetailUpsertSchema>,
  ): Promise<BookingCruiseDetail> {
    const [existing] = await db
      .select()
      .from(bookingCruiseDetails)
      .where(eq(bookingCruiseDetails.bookingId, bookingId))
      .limit(1)

    const payload: NewBookingCruiseDetail = {
      ...data,
      bookingId,
      quotedComponentsJson: (data.quotedComponentsJson ?? []) as QuoteComponent[],
    }

    if (existing) {
      const [row] = await db
        .update(bookingCruiseDetails)
        .set({ ...payload, updatedAt: new Date() })
        .where(eq(bookingCruiseDetails.bookingId, bookingId))
        .returning()
      if (!row) throw new Error("Failed to update booking cruise details")
      return row
    }

    const [row] = await db.insert(bookingCruiseDetails).values(payload).returning()
    if (!row) throw new Error("Failed to insert booking cruise details")
    return row
  },

  async remove(db: PostgresJsDatabase, bookingId: string): Promise<boolean> {
    const result = await db
      .delete(bookingCruiseDetails)
      .where(eq(bookingCruiseDetails.bookingId, bookingId))
      .returning({ id: bookingCruiseDetails.bookingId })
    return result.length > 0
  },
}

export const bookingGroupCruiseDetailsService = {
  async get(
    db: PostgresJsDatabase,
    bookingGroupId: string,
  ): Promise<BookingGroupCruiseDetail | null> {
    const [row] = await db
      .select()
      .from(bookingGroupCruiseDetails)
      .where(eq(bookingGroupCruiseDetails.bookingGroupId, bookingGroupId))
      .limit(1)
    return row ?? null
  },

  async upsert(
    db: PostgresJsDatabase,
    bookingGroupId: string,
    data: z.infer<typeof groupCruiseDetailUpsertSchema>,
  ): Promise<BookingGroupCruiseDetail> {
    const [existing] = await db
      .select()
      .from(bookingGroupCruiseDetails)
      .where(eq(bookingGroupCruiseDetails.bookingGroupId, bookingGroupId))
      .limit(1)

    const payload: NewBookingGroupCruiseDetail = { ...data, bookingGroupId }

    if (existing) {
      const [row] = await db
        .update(bookingGroupCruiseDetails)
        .set({ ...payload, updatedAt: new Date() })
        .where(eq(bookingGroupCruiseDetails.bookingGroupId, bookingGroupId))
        .returning()
      if (!row) throw new Error("Failed to update booking group cruise details")
      return row
    }

    const [row] = await db.insert(bookingGroupCruiseDetails).values(payload).returning()
    if (!row) throw new Error("Failed to insert booking group cruise details")
    return row
  },

  async remove(db: PostgresJsDatabase, bookingGroupId: string): Promise<boolean> {
    const result = await db
      .delete(bookingGroupCruiseDetails)
      .where(eq(bookingGroupCruiseDetails.bookingGroupId, bookingGroupId))
      .returning({ id: bookingGroupCruiseDetails.bookingGroupId })
    return result.length > 0
  },
}

// ---------- routes ----------

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const cruisesBookingExtensionRoutes = new Hono<Env>()
  .get("/:bookingId/cruise-details", async (c) => {
    const bookingId = c.req.param("bookingId")
    const row = await bookingCruiseDetailsService.get(c.get("db"), bookingId)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .put("/:bookingId/cruise-details", async (c) => {
    const bookingId = c.req.param("bookingId")
    const data = await parseJsonBody(c, cruiseDetailUpsertSchema)
    const row = await bookingCruiseDetailsService.upsert(c.get("db"), bookingId, data)
    return c.json({ data: row })
  })
  .delete("/:bookingId/cruise-details", async (c) => {
    const bookingId = c.req.param("bookingId")
    const ok = await bookingCruiseDetailsService.remove(c.get("db"), bookingId)
    if (!ok) return c.json({ error: "not_found" }, 404)
    return c.body(null, 204)
  })
  .get("/groups/:groupId/cruise-details", async (c) => {
    const groupId = c.req.param("groupId")
    const row = await bookingGroupCruiseDetailsService.get(c.get("db"), groupId)
    if (!row) return c.json({ error: "not_found" }, 404)
    return c.json({ data: row })
  })
  .put("/groups/:groupId/cruise-details", async (c) => {
    const groupId = c.req.param("groupId")
    const data = await parseJsonBody(c, groupCruiseDetailUpsertSchema)
    const row = await bookingGroupCruiseDetailsService.upsert(c.get("db"), groupId, data)
    return c.json({ data: row })
  })
  .delete("/groups/:groupId/cruise-details", async (c) => {
    const groupId = c.req.param("groupId")
    const ok = await bookingGroupCruiseDetailsService.remove(c.get("db"), groupId)
    if (!ok) return c.json({ error: "not_found" }, 404)
    return c.body(null, 204)
  })

// ---------- HonoExtension export ----------

const cruisesBookingExtensionDef: Extension = {
  name: "cruises-booking",
  module: "bookings",
}

export const cruisesBookingExtension: HonoExtension = {
  extension: cruisesBookingExtensionDef,
  adminRoutes: cruisesBookingExtensionRoutes,
}
