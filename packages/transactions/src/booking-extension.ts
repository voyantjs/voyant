import type { Extension } from "@voyantjs/core"
import type { HonoExtension } from "@voyantjs/hono/module"
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { z } from "zod"

// ---------- schema ----------

export const bookingTransactionDetails = pgTable(
  "booking_transaction_details",
  {
    bookingId: text("booking_id").primaryKey(),
    offerId: text("offer_id"),
    orderId: text("order_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_btd_offer").on(t.offerId),
    index("idx_btd_order").on(t.orderId),
  ],
)

export type BookingTransactionDetail = typeof bookingTransactionDetails.$inferSelect
export type NewBookingTransactionDetail = typeof bookingTransactionDetails.$inferInsert

// ---------- validation ----------

const bookingTransactionDetailSchema = z.object({
  offerId: z.string().optional().nullable(),
  orderId: z.string().optional().nullable(),
})

// ---------- service ----------

export const bookingTransactionExtensionService = {
  async get(db: PostgresJsDatabase, bookingId: string) {
    const [row] = await db
      .select()
      .from(bookingTransactionDetails)
      .where(eq(bookingTransactionDetails.bookingId, bookingId))
      .limit(1)
    return row ?? null
  },

  async upsert(
    db: PostgresJsDatabase,
    bookingId: string,
    data: z.infer<typeof bookingTransactionDetailSchema>,
  ) {
    const [row] = await db
      .insert(bookingTransactionDetails)
      .values({
        bookingId,
        offerId: data.offerId ?? null,
        orderId: data.orderId ?? null,
      })
      .onConflictDoUpdate({
        target: bookingTransactionDetails.bookingId,
        set: {
          offerId: data.offerId ?? null,
          orderId: data.orderId ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()
    return row ?? null
  },

  async remove(db: PostgresJsDatabase, bookingId: string) {
    const [row] = await db
      .delete(bookingTransactionDetails)
      .where(eq(bookingTransactionDetails.bookingId, bookingId))
      .returning({ bookingId: bookingTransactionDetails.bookingId })
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

const bookingTransactionExtensionRoutes = new Hono<Env>()

  .get("/:bookingId/transaction-details", async (c) => {
    const row = await bookingTransactionExtensionService.get(
      c.get("db"),
      c.req.param("bookingId"),
    )
    if (!row) {
      return c.json({ data: null })
    }
    return c.json({ data: row })
  })

  .put("/:bookingId/transaction-details", async (c) => {
    const data = bookingTransactionDetailSchema.parse(await c.req.json())
    const row = await bookingTransactionExtensionService.upsert(
      c.get("db"),
      c.req.param("bookingId"),
      data,
    )
    return c.json({ data: row })
  })

  .delete("/:bookingId/transaction-details", async (c) => {
    const row = await bookingTransactionExtensionService.remove(
      c.get("db"),
      c.req.param("bookingId"),
    )
    if (!row) {
      return c.json({ error: "Not found" }, 404)
    }
    return c.json({ success: true })
  })

// ---------- extension export ----------

const transactionsBookingExtensionDef: Extension = {
  name: "transactions-booking",
  module: "bookings",
}

export const transactionsBookingExtension: HonoExtension = {
  extension: transactionsBookingExtensionDef,
  routes: bookingTransactionExtensionRoutes,
}
