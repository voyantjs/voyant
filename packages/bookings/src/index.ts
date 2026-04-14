import type { LinkableDefinition, Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { bookingRoutes } from "./routes.js"
import { publicBookingRoutes } from "./routes-public.js"

export { bookingsSupplierExtension } from "./extensions/suppliers.js"
export {
  type BookingPiiAuditEvent,
  type BookingPiiServiceOptions,
  createBookingPiiService,
  type UpsertBookingParticipantTravelDetailInput,
} from "./pii.js"
export type { ConvertProductData } from "./service.js"
export { bookingsService } from "./service.js"
export {
  type ExpireStaleBookingHoldsInput,
  type ExpireStaleBookingHoldsResult,
  expireStaleBookingHolds,
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
  adminRoutes: bookingRoutes,
  publicRoutes: publicBookingRoutes,
  routes: bookingRoutes,
}

export type { BookingRoutes } from "./routes.js"
export type { PublicBookingRoutes } from "./routes-public.js"
export { publicBookingRoutes } from "./routes-public.js"
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
  bookingParticipantTravelDetailSelectSchema,
  bookingParticipantTravelDetails,
  bookingParticipantTravelDetailUpdateSchema,
  decryptedBookingParticipantTravelDetailSchema,
} from "./schema/travel-details.js"
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
  BookingSessionState,
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
  NewBookingSessionState,
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
  bookingSessionStates,
  bookingSupplierStatuses,
  bookings,
} from "./schema.js"
export { publicBookingsService } from "./service-public.js"
export {
  bookingListQuerySchema,
  cancelBookingSchema,
  confirmBookingSchema,
  convertProductSchema,
  createBookingSchema,
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
  internalBookingOverviewLookupQuerySchema,
  publicBookingOverviewLookupQuerySchema,
  publicBookingSessionMutationSchema,
  publicBookingSessionRepriceItemSchema,
  publicBookingSessionRepriceResultSchema,
  publicBookingSessionRepriceSummarySchema,
  publicBookingSessionStateSchema,
  publicCreateBookingSessionSchema,
  publicRepriceBookingSessionSchema,
  publicUpdateBookingSessionSchema,
  publicUpsertBookingSessionStateSchema,
  recordBookingRedemptionSchema,
  reserveBookingFromTransactionSchema,
  reserveBookingSchema,
  updateBookingAllocationSchema,
  updateBookingFulfillmentSchema,
  updateBookingItemSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  updateParticipantSchema,
  updatePassengerSchema,
  updateSupplierStatusSchema,
  upsertParticipantTravelDetailsSchema,
} from "./validation.js"
