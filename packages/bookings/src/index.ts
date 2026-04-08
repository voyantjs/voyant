import type { LinkableDefinition, Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { bookingRoutes } from "./routes.js"

export { bookingsService } from "./service.js"
export type { ConvertProductData } from "./service.js"
export {
  createBookingPiiService,
  type BookingPiiAuditEvent,
  type BookingPiiServiceOptions,
  type UpsertBookingParticipantTravelDetailInput,
} from "./pii.js"
export { bookingsSupplierExtension } from "./extensions/suppliers.js"
export {
  expireStaleBookingHolds,
  type ExpireStaleBookingHoldsInput,
  type ExpireStaleBookingHoldsResult,
} from "./tasks/index.js"

export const bookingLinkable: LinkableDefinition = {
  module: "bookings",
  entity: "booking",
  table: "bookings",
  idPrefix: "book",
}

export const bookingsLinkable = {
  booking: bookingLinkable,
}

export const bookingsModule: Module = {
  name: "bookings",
  linkable: bookingsLinkable,
}

export const bookingsHonoModule: HonoModule = {
  module: bookingsModule,
  routes: bookingRoutes,
}

export type { BookingRoutes } from "./routes.js"
export type {
  Booking,
  BookingActivity,
  BookingAllocation,
  BookingDocument,
  BookingFulfillment,
  BookingItem,
  BookingItemParticipant,
  BookingNote,
  BookingParticipant,
  BookingPassenger,
  BookingPiiAccessLog,
  BookingRedemptionEvent,
  BookingSupplierStatus,
  NewBooking,
  NewBookingActivity,
  NewBookingAllocation,
  NewBookingDocument,
  NewBookingFulfillment,
  NewBookingItem,
  NewBookingItemParticipant,
  NewBookingNote,
  NewBookingParticipant,
  NewBookingPassenger,
  NewBookingPiiAccessLog,
  NewBookingRedemptionEvent,
  NewBookingSupplierStatus,
} from "./schema.js"
export {
  bookingActivityLog,
  bookingAllocations,
  bookingDocuments,
  bookingFulfillments,
  bookingItemParticipants,
  bookingItems,
  bookingNotes,
  bookingParticipants,
  bookingPassengers,
  bookingPiiAccessLog,
  bookingRedemptionEvents,
  bookingSupplierStatuses,
  bookings,
} from "./schema.js"
export type {
  BookingParticipantDietary,
  BookingParticipantIdentity,
  BookingParticipantTravelDetail,
  DecryptedBookingParticipantTravelDetail,
  NewBookingParticipantTravelDetail,
} from "./schema/travel-details.js"
export {
  bookingParticipantDietarySchema,
  bookingParticipantIdentitySchema,
  bookingParticipantTravelDetailInsertSchema,
  bookingParticipantTravelDetails,
  bookingParticipantTravelDetailSelectSchema,
  bookingParticipantTravelDetailUpdateSchema,
  decryptedBookingParticipantTravelDetailSchema,
} from "./schema/travel-details.js"
export {
  bookingListQuerySchema,
  cancelBookingSchema,
  confirmBookingSchema,
  createBookingSchema,
  convertProductSchema,
  expireBookingSchema,
  expireStaleBookingsSchema,
  extendBookingHoldSchema,
  insertBookingAllocationSchema,
  insertBookingDocumentSchema,
  insertBookingFulfillmentSchema,
  insertBookingItemParticipantSchema,
  insertBookingItemSchema,
  insertBookingNoteSchema,
  insertBookingSchema,
  insertParticipantSchema,
  insertPassengerSchema,
  insertSupplierStatusSchema,
  recordBookingRedemptionSchema,
  reserveBookingSchema,
  reserveBookingFromTransactionSchema,
  upsertParticipantTravelDetailsSchema,
  updateBookingAllocationSchema,
  updateBookingFulfillmentSchema,
  updateBookingItemSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  updateParticipantSchema,
  updatePassengerSchema,
  updateSupplierStatusSchema,
} from "./validation.js"
