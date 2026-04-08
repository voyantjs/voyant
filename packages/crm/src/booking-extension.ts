import type { Extension } from "@voyantjs/core"
import type { HonoExtension } from "@voyantjs/hono/module"
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { z } from "zod"

// ---------- schema ----------

export const bookingCrmDetails = pgTable(
  "booking_crm_details",
  {
    bookingId: text("booking_id").primaryKey(),
    opportunityId: text("opportunity_id"),
    quoteId: text("quote_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_bcd_opportunity").on(t.opportunityId),
    index("idx_bcd_quote").on(t.quoteId),
  ],
)

export type BookingCrmDetail = typeof bookingCrmDetails.$inferSelect
export type NewBookingCrmDetail = typeof bookingCrmDetails.$inferInsert

// ---------- validation ----------

const bookingCrmDetailSchema = z.object({
  opportunityId: z.string().optional().nullable(),
  quoteId: z.string().optional().nullable(),
})

// ---------- service ----------

export const bookingCrmExtensionService = {
  async get(db: PostgresJsDatabase, bookingId: string) {
    const [row] = await db
      .select()
      .from(bookingCrmDetails)
      .where(eq(bookingCrmDetails.bookingId, bookingId))
      .limit(1)
    return row ?? null
  },

  async upsert(
    db: PostgresJsDatabase,
    bookingId: string,
    data: z.infer<typeof bookingCrmDetailSchema>,
  ) {
    const [row] = await db
      .insert(bookingCrmDetails)
      .values({
        bookingId,
        opportunityId: data.opportunityId ?? null,
        quoteId: data.quoteId ?? null,
      })
      .onConflictDoUpdate({
        target: bookingCrmDetails.bookingId,
        set: {
          opportunityId: data.opportunityId ?? null,
          quoteId: data.quoteId ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()
    return row ?? null
  },

  async remove(db: PostgresJsDatabase, bookingId: string) {
    const [row] = await db
      .delete(bookingCrmDetails)
      .where(eq(bookingCrmDetails.bookingId, bookingId))
      .returning({ bookingId: bookingCrmDetails.bookingId })
    return row ?? null
  },
}

// ---------- routes ----------

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

const bookingCrmExtensionRoutes = new Hono<Env>()

  .get("/:bookingId/crm-details", async (c) => {
    const row = await bookingCrmExtensionService.get(c.get("db"), c.req.param("bookingId"))
    if (!row) {
      return c.json({ data: null })
    }
    return c.json({ data: row })
  })

  .put("/:bookingId/crm-details", async (c) => {
    const data = bookingCrmDetailSchema.parse(await c.req.json())
    const row = await bookingCrmExtensionService.upsert(
      c.get("db"),
      c.req.param("bookingId"),
      data,
    )
    return c.json({ data: row })
  })

  .delete("/:bookingId/crm-details", async (c) => {
    const row = await bookingCrmExtensionService.remove(c.get("db"), c.req.param("bookingId"))
    if (!row) {
      return c.json({ error: "Not found" }, 404)
    }
    return c.json({ success: true })
  })

// ---------- extension export ----------

const crmBookingExtensionDef: Extension = {
  name: "crm-booking",
  module: "bookings",
}

export const crmBookingExtension: HonoExtension = {
  extension: crmBookingExtensionDef,
  routes: bookingCrmExtensionRoutes,
}
