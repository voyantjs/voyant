import type { LinkableDefinition, Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import { BOOKING_ROUTE_RUNTIME_CONTAINER_KEY, buildBookingRouteRuntime } from "./route-runtime.js"
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
  type AddBookingGroupMemberInput,
  type BookingGroupListQuery,
  type BookingGroupMemberWithBooking,
  bookingGroupsService,
  type CreateBookingGroupInput,
  type UpdateBookingGroupInput,
} from "./service-groups.js"
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

export function createBookingsHonoModule(): HonoModule {
  const module: Module = {
    ...bookingsModule,
    bootstrap: ({ bindings, container }) => {
      container.register(
        BOOKING_ROUTE_RUNTIME_CONTAINER_KEY,
        buildBookingRouteRuntime(bindings as Record<string, unknown>),
      )
    },
  }

  return {
    module,
    adminRoutes: bookingRoutes,
    publicRoutes: publicBookingRoutes,
    routes: bookingRoutes,
  }
}

export const bookingsHonoModule: HonoModule = createBookingsHonoModule()

export type { BookingRouteRuntime } from "./route-runtime.js"
export {
  BOOKING_ROUTE_RUNTIME_CONTAINER_KEY,
  buildBookingRouteRuntime,
} from "./route-runtime.js"
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
  BookingGroup,
  BookingGroupMember,
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
  NewBookingGroup,
  NewBookingGroupMember,
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
  bookingGroupKindEnum,
  bookingGroupMemberRoleEnum,
  bookingGroupMembers,
  bookingGroups,
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
  addBookingGroupMemberSchema,
  bookingGroupKindSchema,
  bookingGroupListQuerySchema,
  bookingGroupMemberRoleSchema,
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
  insertBookingGroupSchema,
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
  updateBookingGroupSchema,
  updateBookingItemSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  updateParticipantSchema,
  updatePassengerSchema,
  updateSupplierStatusSchema,
  upsertParticipantTravelDetailsSchema,
} from "./validation.js"
