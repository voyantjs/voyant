import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { boolean, date, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import {
  bookingParticipantTypeEnum,
  bookingPiiAccessActionEnum,
  bookingPiiAccessOutcomeEnum,
  bookingSourceTypeEnum,
  bookingStatusEnum,
  bookingTravelerCategoryEnum,
} from "./schema-shared"

export const bookings = pgTable(
  "bookings",
  {
    id: typeId("bookings"),
    bookingNumber: text("booking_number").notNull().unique(),
    status: bookingStatusEnum("status").notNull().default("draft"),
    personId: text("person_id"),
    organizationId: text("organization_id"),
    sourceType: bookingSourceTypeEnum("source_type").notNull().default("manual"),
    externalBookingRef: text("external_booking_ref"),
    communicationLanguage: text("communication_language"),
    sellCurrency: text("sell_currency").notNull(),
    baseCurrency: text("base_currency"),
    sellAmountCents: integer("sell_amount_cents"),
    baseSellAmountCents: integer("base_sell_amount_cents"),
    costAmountCents: integer("cost_amount_cents"),
    baseCostAmountCents: integer("base_cost_amount_cents"),
    marginPercent: integer("margin_percent"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    pax: integer("pax"),
    internalNotes: text("internal_notes"),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_bookings_status").on(table.status),
    index("idx_bookings_status_created").on(table.status, table.createdAt),
    index("idx_bookings_person").on(table.personId),
    index("idx_bookings_organization").on(table.organizationId),
    index("idx_bookings_source_type").on(table.sourceType),
    index("idx_bookings_number").on(table.bookingNumber),
  ],
)

export const bookingParticipants = pgTable(
  "booking_participants",
  {
    id: typeId("booking_participants"),
    bookingId: typeIdRef("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    personId: text("person_id"),
    participantType: bookingParticipantTypeEnum("participant_type").notNull().default("traveler"),
    travelerCategory: bookingTravelerCategoryEnum("traveler_category"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    preferredLanguage: text("preferred_language"),
    accessibilityNeeds: text("accessibility_needs"),
    specialRequests: text("special_requests"),
    isPrimary: boolean("is_primary").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_booking_participants_booking").on(table.bookingId),
    index("idx_booking_participants_booking_primary_created").on(
      table.bookingId,
      table.isPrimary,
      table.createdAt,
    ),
    index("idx_booking_participants_booking_type_created").on(
      table.bookingId,
      table.participantType,
      table.createdAt,
    ),
    index("idx_booking_participants_type").on(table.participantType),
    index("idx_booking_participants_person").on(table.personId),
  ],
)

export const bookingPiiAccessLog = pgTable(
  "booking_pii_access_log",
  {
    id: typeId("booking_pii_access_log"),
    bookingId: text("booking_id"),
    participantId: text("participant_id"),
    actorId: text("actor_id"),
    actorType: text("actor_type"),
    callerType: text("caller_type"),
    action: bookingPiiAccessActionEnum("action").notNull(),
    outcome: bookingPiiAccessOutcomeEnum("outcome").notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_booking_pii_access_log_booking").on(table.bookingId),
    index("idx_booking_pii_access_log_participant").on(table.participantId),
    index("idx_booking_pii_access_log_actor").on(table.actorId),
    index("idx_booking_pii_access_log_created_at").on(table.createdAt),
  ],
)

export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
export type BookingParticipant = typeof bookingParticipants.$inferSelect
export type NewBookingParticipant = typeof bookingParticipants.$inferInsert
export const bookingPassengers = bookingParticipants
export type BookingPassenger = BookingParticipant
export type NewBookingPassenger = NewBookingParticipant
export type BookingPiiAccessLog = typeof bookingPiiAccessLog.$inferSelect
export type NewBookingPiiAccessLog = typeof bookingPiiAccessLog.$inferInsert
