import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const bookingTransactionDetailsRef = pgTable("booking_transaction_details", {
  bookingId: text("booking_id").primaryKey(),
  offerId: text("offer_id"),
  orderId: text("order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
