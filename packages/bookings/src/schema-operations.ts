import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { bookingParticipants, bookings } from "./schema-core"
import {
  bookingActivityTypeEnum,
  bookingDocumentTypeEnum,
  supplierConfirmationStatusEnum,
} from "./schema-shared"

export const bookingSupplierStatuses = pgTable(
  "booking_supplier_statuses",
  {
    id: typeId("booking_supplier_statuses"),
    bookingId: typeIdRef("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    supplierServiceId: text("supplier_service_id"),
    serviceName: text("service_name").notNull(),
    status: supplierConfirmationStatusEnum("status").notNull().default("pending"),
    supplierReference: text("supplier_reference"),
    costCurrency: text("cost_currency").notNull(),
    costAmountCents: integer("cost_amount_cents").notNull(),
    notes: text("notes"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_booking_supplier_statuses_booking").on(table.bookingId),
    index("idx_booking_supplier_statuses_service").on(table.supplierServiceId),
  ],
)

export const bookingActivityLog = pgTable(
  "booking_activity_log",
  {
    id: typeId("booking_activity_log"),
    bookingId: typeIdRef("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    actorId: text("actor_id"),
    activityType: bookingActivityTypeEnum("activity_type").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_booking_activity_log_booking").on(table.bookingId)],
)

export const bookingNotes = pgTable(
  "booking_notes",
  {
    id: typeId("booking_notes"),
    bookingId: typeIdRef("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_booking_notes_booking").on(table.bookingId)],
)

export const bookingDocuments = pgTable(
  "booking_documents",
  {
    id: typeId("booking_documents"),
    bookingId: typeIdRef("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    participantId: typeIdRef("participant_id").references(() => bookingParticipants.id, {
      onDelete: "set null",
    }),
    type: bookingDocumentTypeEnum("type").notNull(),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_booking_documents_booking").on(table.bookingId),
    index("idx_booking_documents_participant").on(table.participantId),
  ],
)

export type BookingSupplierStatus = typeof bookingSupplierStatuses.$inferSelect
export type NewBookingSupplierStatus = typeof bookingSupplierStatuses.$inferInsert
export type BookingActivity = typeof bookingActivityLog.$inferSelect
export type NewBookingActivity = typeof bookingActivityLog.$inferInsert
export type BookingNote = typeof bookingNotes.$inferSelect
export type NewBookingNote = typeof bookingNotes.$inferInsert
export type BookingDocument = typeof bookingDocuments.$inferSelect
export type NewBookingDocument = typeof bookingDocuments.$inferInsert
