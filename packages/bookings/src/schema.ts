import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { availabilitySlotsRef } from "./availability-ref.js"

export const bookingStatusEnum = pgEnum("booking_status", [
  "draft",
  "on_hold",
  "confirmed",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
])

export const supplierConfirmationStatusEnum = pgEnum("supplier_confirmation_status", [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
])

export const bookingActivityTypeEnum = pgEnum("booking_activity_type", [
  "booking_created",
  "booking_reserved",
  "booking_converted",
  "booking_confirmed",
  "hold_extended",
  "hold_expired",
  "status_change",
  "item_update",
  "allocation_released",
  "fulfillment_issued",
  "fulfillment_updated",
  "redemption_recorded",
  "supplier_update",
  "passenger_update",
  "note_added",
])

export const bookingDocumentTypeEnum = pgEnum("booking_document_type", [
  "visa",
  "insurance",
  "health",
  "passport_copy",
  "other",
])

export const bookingSourceTypeEnum = pgEnum("booking_source_type", [
  "direct",
  "manual",
  "affiliate",
  "ota",
  "reseller",
  "api_partner",
  "internal",
])

export const bookingParticipantTypeEnum = pgEnum("booking_participant_type", [
  "traveler",
  "booker",
  "contact",
  "occupant",
  "staff",
  "other",
])

export const bookingTravelerCategoryEnum = pgEnum("booking_traveler_category", [
  "adult",
  "child",
  "infant",
  "senior",
  "other",
])

export const bookingItemTypeEnum = pgEnum("booking_item_type", [
  "unit",
  "extra",
  "service",
  "fee",
  "tax",
  "discount",
  "adjustment",
  "accommodation",
  "transport",
  "other",
])

export const bookingItemStatusEnum = pgEnum("booking_item_status", [
  "draft",
  "on_hold",
  "confirmed",
  "cancelled",
  "expired",
  "fulfilled",
])

export const bookingAllocationTypeEnum = pgEnum("booking_allocation_type", [
  "unit",
  "pickup",
  "resource",
])

export const bookingAllocationStatusEnum = pgEnum("booking_allocation_status", [
  "held",
  "confirmed",
  "released",
  "expired",
  "cancelled",
  "fulfilled",
])

export const bookingFulfillmentTypeEnum = pgEnum("booking_fulfillment_type", [
  "voucher",
  "ticket",
  "pdf",
  "qr_code",
  "barcode",
  "mobile",
  "other",
])

export const bookingFulfillmentDeliveryChannelEnum = pgEnum(
  "booking_fulfillment_delivery_channel",
  ["download", "email", "api", "wallet", "other"],
)

export const bookingFulfillmentStatusEnum = pgEnum("booking_fulfillment_status", [
  "pending",
  "issued",
  "reissued",
  "revoked",
  "failed",
])

export const bookingRedemptionMethodEnum = pgEnum("booking_redemption_method", [
  "manual",
  "scan",
  "api",
  "other",
])

export const bookingItemParticipantRoleEnum = pgEnum("booking_item_participant_role", [
  "traveler",
  "occupant",
  "primary_contact",
  "service_assignee",
  "beneficiary",
  "other",
])

export const bookingPiiAccessActionEnum = pgEnum("booking_pii_access_action", [
  "read",
  "update",
  "delete",
])

export const bookingPiiAccessOutcomeEnum = pgEnum("booking_pii_access_outcome", [
  "allowed",
  "denied",
])

// ---------- bookings ----------

export const bookings = pgTable(
  "bookings",
  {
    id: typeId("bookings"),

    bookingNumber: text("booking_number").notNull().unique(),
    status: bookingStatusEnum("status").notNull().default("draft"),

    // Client link
    personId: text("person_id"),
    organizationId: text("organization_id"),
    sourceType: bookingSourceTypeEnum("source_type").notNull().default("manual"),
    externalBookingRef: text("external_booking_ref"),
    communicationLanguage: text("communication_language"),

    // Financial
    sellCurrency: text("sell_currency").notNull(),
    baseCurrency: text("base_currency"),
    sellAmountCents: integer("sell_amount_cents"),
    baseSellAmountCents: integer("base_sell_amount_cents"),
    costAmountCents: integer("cost_amount_cents"),
    baseCostAmountCents: integer("base_cost_amount_cents"),
    marginPercent: integer("margin_percent"),

    // Trip details
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

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_bookings_status").on(table.status),
    index("idx_bookings_person").on(table.personId),
    index("idx_bookings_organization").on(table.organizationId),
    index("idx_bookings_source_type").on(table.sourceType),
    index("idx_bookings_number").on(table.bookingNumber),
  ],
)

export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert

// ---------- booking_participants ----------

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
    index("idx_booking_participants_type").on(table.participantType),
    index("idx_booking_participants_person").on(table.personId),
  ],
)

export type BookingParticipant = typeof bookingParticipants.$inferSelect
export type NewBookingParticipant = typeof bookingParticipants.$inferInsert

export const bookingPassengers = bookingParticipants
export type BookingPassenger = BookingParticipant
export type NewBookingPassenger = NewBookingParticipant

// ---------- booking_pii_access_log ----------

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

export type BookingPiiAccessLog = typeof bookingPiiAccessLog.$inferSelect
export type NewBookingPiiAccessLog = typeof bookingPiiAccessLog.$inferInsert

// ---------- booking_items ----------

export const bookingItems = pgTable(
  "booking_items",
  {
    id: typeId("booking_items"),
    bookingId: typeIdRef("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    itemType: bookingItemTypeEnum("item_type").notNull().default("unit"),
    status: bookingItemStatusEnum("status").notNull().default("draft"),
    serviceDate: date("service_date"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    quantity: integer("quantity").notNull().default(1),
    sellCurrency: text("sell_currency").notNull(),
    unitSellAmountCents: integer("unit_sell_amount_cents"),
    totalSellAmountCents: integer("total_sell_amount_cents"),
    costCurrency: text("cost_currency"),
    unitCostAmountCents: integer("unit_cost_amount_cents"),
    totalCostAmountCents: integer("total_cost_amount_cents"),
    notes: text("notes"),
    productId: text("product_id"),
    optionId: text("option_id"),
    optionUnitId: text("option_unit_id"),
    pricingCategoryId: text("pricing_category_id"),
    sourceSnapshotId: text("source_snapshot_id"),
    sourceOfferId: text("source_offer_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_booking_items_booking").on(table.bookingId),
    index("idx_booking_items_status").on(table.status),
  ],
)

export type BookingItem = typeof bookingItems.$inferSelect
export type NewBookingItem = typeof bookingItems.$inferInsert

// ---------- booking_allocations ----------

export const bookingAllocations = pgTable(
  "booking_allocations",
  {
    id: typeId("booking_allocations"),
    bookingId: typeIdRef("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    bookingItemId: typeIdRef("booking_item_id")
      .notNull()
      .references(() => bookingItems.id, { onDelete: "cascade" }),
    productId: text("product_id"),
    optionId: text("option_id"),
    optionUnitId: text("option_unit_id"),
    pricingCategoryId: text("pricing_category_id"),
    availabilitySlotId: typeIdRef("availability_slot_id").references(
      () => availabilitySlotsRef.id,
      {
        onDelete: "set null",
      },
    ),
    quantity: integer("quantity").notNull().default(1),
    allocationType: bookingAllocationTypeEnum("allocation_type").notNull().default("unit"),
    status: bookingAllocationStatusEnum("status").notNull().default("held"),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_booking_allocations_booking").on(table.bookingId),
    index("idx_booking_allocations_item").on(table.bookingItemId),
    index("idx_booking_allocations_slot").on(table.availabilitySlotId),
    index("idx_booking_allocations_status").on(table.status),
  ],
)

export type BookingAllocation = typeof bookingAllocations.$inferSelect
export type NewBookingAllocation = typeof bookingAllocations.$inferInsert

// ---------- booking_fulfillments ----------

export const bookingFulfillments = pgTable(
  "booking_fulfillments",
  {
    id: typeId("booking_fulfillments"),
    bookingId: typeIdRef("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    bookingItemId: typeIdRef("booking_item_id").references(() => bookingItems.id, {
      onDelete: "set null",
    }),
    participantId: typeIdRef("participant_id").references(() => bookingParticipants.id, {
      onDelete: "set null",
    }),
    fulfillmentType: bookingFulfillmentTypeEnum("fulfillment_type").notNull(),
    deliveryChannel: bookingFulfillmentDeliveryChannelEnum("delivery_channel").notNull(),
    status: bookingFulfillmentStatusEnum("status").notNull().default("pending"),
    artifactUrl: text("artifact_url"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_booking_fulfillments_booking").on(table.bookingId),
    index("idx_booking_fulfillments_item").on(table.bookingItemId),
    index("idx_booking_fulfillments_participant").on(table.participantId),
    index("idx_booking_fulfillments_status").on(table.status),
  ],
)

export type BookingFulfillment = typeof bookingFulfillments.$inferSelect
export type NewBookingFulfillment = typeof bookingFulfillments.$inferInsert

// ---------- booking_redemption_events ----------

export const bookingRedemptionEvents = pgTable(
  "booking_redemption_events",
  {
    id: typeId("booking_redemption_events"),
    bookingId: typeIdRef("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    bookingItemId: typeIdRef("booking_item_id").references(() => bookingItems.id, {
      onDelete: "set null",
    }),
    participantId: typeIdRef("participant_id").references(() => bookingParticipants.id, {
      onDelete: "set null",
    }),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
    redeemedBy: text("redeemed_by"),
    location: text("location"),
    method: bookingRedemptionMethodEnum("method").notNull().default("manual"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_booking_redemption_events_booking").on(table.bookingId),
    index("idx_booking_redemption_events_item").on(table.bookingItemId),
    index("idx_booking_redemption_events_participant").on(table.participantId),
    index("idx_booking_redemption_events_redeemed_at").on(table.redeemedAt),
  ],
)

export type BookingRedemptionEvent = typeof bookingRedemptionEvents.$inferSelect
export type NewBookingRedemptionEvent = typeof bookingRedemptionEvents.$inferInsert

// ---------- booking_item_participants ----------

export const bookingItemParticipants = pgTable(
  "booking_item_participants",
  {
    id: typeId("booking_item_participants"),
    bookingItemId: typeIdRef("booking_item_id")
      .notNull()
      .references(() => bookingItems.id, { onDelete: "cascade" }),
    participantId: typeIdRef("participant_id")
      .notNull()
      .references(() => bookingParticipants.id, { onDelete: "cascade" }),
    role: bookingItemParticipantRoleEnum("role").notNull().default("traveler"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_booking_item_participants_item").on(table.bookingItemId),
    index("idx_booking_item_participants_participant").on(table.participantId),
  ],
)

export type BookingItemParticipant = typeof bookingItemParticipants.$inferSelect
export type NewBookingItemParticipant = typeof bookingItemParticipants.$inferInsert

// ---------- booking_supplier_statuses ----------

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

export type BookingSupplierStatus = typeof bookingSupplierStatuses.$inferSelect
export type NewBookingSupplierStatus = typeof bookingSupplierStatuses.$inferInsert

// ---------- booking_activity_log ----------

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

export type BookingActivity = typeof bookingActivityLog.$inferSelect
export type NewBookingActivity = typeof bookingActivityLog.$inferInsert

// ---------- booking_notes ----------

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

export type BookingNote = typeof bookingNotes.$inferSelect
export type NewBookingNote = typeof bookingNotes.$inferInsert

// ---------- booking_documents ----------

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

export type BookingDocument = typeof bookingDocuments.$inferSelect
export type NewBookingDocument = typeof bookingDocuments.$inferInsert

// ---------- relations ----------

export const bookingsRelations = relations(bookings, ({ many }) => ({
  participants: many(bookingParticipants),
  supplierStatuses: many(bookingSupplierStatuses),
  activityLog: many(bookingActivityLog),
  notes: many(bookingNotes),
  documents: many(bookingDocuments),
  fulfillments: many(bookingFulfillments),
  redemptionEvents: many(bookingRedemptionEvents),
  items: many(bookingItems),
  allocations: many(bookingAllocations),
}))

export const bookingParticipantsRelations = relations(bookingParticipants, ({ one, many }) => ({
  booking: one(bookings, { fields: [bookingParticipants.bookingId], references: [bookings.id] }),
  documents: many(bookingDocuments),
  fulfillments: many(bookingFulfillments),
  redemptionEvents: many(bookingRedemptionEvents),
  itemLinks: many(bookingItemParticipants),
}))

export const bookingItemsRelations = relations(bookingItems, ({ one, many }) => ({
  booking: one(bookings, { fields: [bookingItems.bookingId], references: [bookings.id] }),
  participantLinks: many(bookingItemParticipants),
  allocations: many(bookingAllocations),
  fulfillments: many(bookingFulfillments),
  redemptionEvents: many(bookingRedemptionEvents),
}))

export const bookingAllocationsRelations = relations(bookingAllocations, ({ one }) => ({
  booking: one(bookings, { fields: [bookingAllocations.bookingId], references: [bookings.id] }),
  bookingItem: one(bookingItems, {
    fields: [bookingAllocations.bookingItemId],
    references: [bookingItems.id],
  }),
  availabilitySlot: one(availabilitySlotsRef, {
    fields: [bookingAllocations.availabilitySlotId],
    references: [availabilitySlotsRef.id],
  }),
}))

export const bookingItemParticipantsRelations = relations(bookingItemParticipants, ({ one }) => ({
  bookingItem: one(bookingItems, {
    fields: [bookingItemParticipants.bookingItemId],
    references: [bookingItems.id],
  }),
  participant: one(bookingParticipants, {
    fields: [bookingItemParticipants.participantId],
    references: [bookingParticipants.id],
  }),
}))

export const bookingSupplierStatusesRelations = relations(bookingSupplierStatuses, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingSupplierStatuses.bookingId],
    references: [bookings.id],
  }),
}))

export const bookingFulfillmentsRelations = relations(bookingFulfillments, ({ one }) => ({
  booking: one(bookings, { fields: [bookingFulfillments.bookingId], references: [bookings.id] }),
  bookingItem: one(bookingItems, {
    fields: [bookingFulfillments.bookingItemId],
    references: [bookingItems.id],
  }),
  participant: one(bookingParticipants, {
    fields: [bookingFulfillments.participantId],
    references: [bookingParticipants.id],
  }),
}))

export const bookingRedemptionEventsRelations = relations(bookingRedemptionEvents, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingRedemptionEvents.bookingId],
    references: [bookings.id],
  }),
  bookingItem: one(bookingItems, {
    fields: [bookingRedemptionEvents.bookingItemId],
    references: [bookingItems.id],
  }),
  participant: one(bookingParticipants, {
    fields: [bookingRedemptionEvents.participantId],
    references: [bookingParticipants.id],
  }),
}))

export const bookingActivityLogRelations = relations(bookingActivityLog, ({ one }) => ({
  booking: one(bookings, { fields: [bookingActivityLog.bookingId], references: [bookings.id] }),
}))

export const bookingNotesRelations = relations(bookingNotes, ({ one }) => ({
  booking: one(bookings, { fields: [bookingNotes.bookingId], references: [bookings.id] }),
}))

export const bookingDocumentsRelations = relations(bookingDocuments, ({ one }) => ({
  booking: one(bookings, { fields: [bookingDocuments.bookingId], references: [bookings.id] }),
  participant: one(bookingParticipants, {
    fields: [bookingDocuments.participantId],
    references: [bookingParticipants.id],
  }),
}))
