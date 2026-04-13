import { relations } from "drizzle-orm"

import { availabilitySlotsRef } from "./availability-ref.js"
import { bookingParticipants, bookings } from "./schema-core"
import {
  bookingAllocations,
  bookingFulfillments,
  bookingItemParticipants,
  bookingItems,
  bookingRedemptionEvents,
} from "./schema-items"
import {
  bookingActivityLog,
  bookingDocuments,
  bookingNotes,
  bookingSessionStates,
  bookingSupplierStatuses,
} from "./schema-operations"

export const bookingsRelations = relations(bookings, ({ many }) => ({
  participants: many(bookingParticipants),
  supplierStatuses: many(bookingSupplierStatuses),
  activityLog: many(bookingActivityLog),
  notes: many(bookingNotes),
  sessionStates: many(bookingSessionStates),
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

export const bookingSessionStatesRelations = relations(bookingSessionStates, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingSessionStates.bookingId],
    references: [bookings.id],
  }),
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
