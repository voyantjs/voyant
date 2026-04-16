import {
  publicBookingSessionRepriceResultSchema,
  publicBookingSessionSchema,
  publicBookingSessionStateSchema,
} from "@voyantjs/bookings/validation"
import { z } from "zod"

export const paginatedEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })

export const singleEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: item })
export const arrayEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: z.array(item) })
export const successEnvelope = z.object({ success: z.boolean() })

export const bookingStatusSchema = z.enum([
  "draft",
  "on_hold",
  "confirmed",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
])

export const supplierConfirmationStatusSchema = z.enum([
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
])

export const bookingRecordSchema = z.object({
  id: z.string(),
  bookingNumber: z.string(),
  status: bookingStatusSchema,
  personId: z.string().nullable(),
  organizationId: z.string().nullable(),
  sellCurrency: z.string(),
  sellAmountCents: z.number().int().nullable(),
  costAmountCents: z.number().int().nullable(),
  marginPercent: z.number().int().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  pax: z.number().int().nullable(),
  internalNotes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type BookingRecord = z.infer<typeof bookingRecordSchema>

export const bookingPassengerRecordSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  specialRequests: z.string().nullable(),
  isLeadPassenger: z.boolean().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

export type BookingPassengerRecord = z.infer<typeof bookingPassengerRecordSchema>

export const bookingSupplierStatusRecordSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  supplierServiceId: z.string().nullable(),
  serviceName: z.string(),
  status: supplierConfirmationStatusSchema,
  supplierReference: z.string().nullable(),
  costCurrency: z.string(),
  costAmountCents: z.number().int(),
  notes: z.string().nullable(),
  confirmedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type BookingSupplierStatusRecord = z.infer<typeof bookingSupplierStatusRecordSchema>

export const bookingActivityRecordSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  actorId: z.string().nullable(),
  activityType: z.string(),
  description: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
})

export type BookingActivityRecord = z.infer<typeof bookingActivityRecordSchema>

export const bookingNoteRecordSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  authorId: z.string(),
  content: z.string(),
  createdAt: z.string(),
})

export type BookingNoteRecord = z.infer<typeof bookingNoteRecordSchema>

export const bookingItemTypeSchema = z.enum([
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

export const bookingItemStatusSchema = z.enum([
  "draft",
  "on_hold",
  "confirmed",
  "cancelled",
  "expired",
  "fulfilled",
])

export const bookingItemRecordSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  itemType: bookingItemTypeSchema,
  status: bookingItemStatusSchema,
  serviceDate: z.string().nullable(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  quantity: z.number().int(),
  sellCurrency: z.string(),
  unitSellAmountCents: z.number().int().nullable(),
  totalSellAmountCents: z.number().int().nullable(),
  costCurrency: z.string().nullable(),
  unitCostAmountCents: z.number().int().nullable(),
  totalCostAmountCents: z.number().int().nullable(),
  notes: z.string().nullable(),
  productId: z.string().nullable(),
  optionId: z.string().nullable(),
  optionUnitId: z.string().nullable(),
  pricingCategoryId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type BookingItemRecord = z.infer<typeof bookingItemRecordSchema>

export const bookingItemParticipantRoleSchema = z.enum([
  "traveler",
  "occupant",
  "primary_contact",
  "service_assignee",
  "beneficiary",
  "other",
])

export const bookingItemParticipantRecordSchema = z.object({
  id: z.string(),
  bookingItemId: z.string(),
  participantId: z.string(),
  role: bookingItemParticipantRoleSchema,
  isPrimary: z.boolean(),
  createdAt: z.string(),
})

export type BookingItemParticipantRecord = z.infer<typeof bookingItemParticipantRecordSchema>

export const bookingDocumentTypeSchema = z.enum([
  "visa",
  "insurance",
  "health",
  "passport_copy",
  "other",
])

export const bookingDocumentRecordSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  participantId: z.string().nullable(),
  type: bookingDocumentTypeSchema,
  fileName: z.string(),
  fileUrl: z.string(),
  expiresAt: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
})

export type BookingDocumentRecord = z.infer<typeof bookingDocumentRecordSchema>

export const bookingGroupKindSchema = z.enum(["shared_room", "other"])
export const bookingGroupMemberRoleSchema = z.enum(["primary", "shared"])

export const bookingGroupRecordSchema = z.object({
  id: z.string(),
  kind: bookingGroupKindSchema,
  label: z.string(),
  primaryBookingId: z.string().nullable(),
  productId: z.string().nullable(),
  optionUnitId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type BookingGroupRecord = z.infer<typeof bookingGroupRecordSchema>

export const bookingGroupMemberRecordSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  bookingId: z.string(),
  role: bookingGroupMemberRoleSchema,
  createdAt: z.string(),
})

export type BookingGroupMemberRecord = z.infer<typeof bookingGroupMemberRecordSchema>

export const bookingGroupMemberWithBookingSchema = bookingGroupMemberRecordSchema.extend({
  booking: bookingRecordSchema.nullable(),
})

export type BookingGroupMemberWithBookingRecord = z.infer<
  typeof bookingGroupMemberWithBookingSchema
>

export const bookingGroupDetailSchema = bookingGroupRecordSchema.extend({
  members: z.array(bookingGroupMemberWithBookingSchema),
})

export type BookingGroupDetailRecord = z.infer<typeof bookingGroupDetailSchema>

export const bookingListResponse = paginatedEnvelope(bookingRecordSchema)
export const bookingSingleResponse = singleEnvelope(bookingRecordSchema)
export const bookingItemsResponse = arrayEnvelope(bookingItemRecordSchema)
export const bookingItemParticipantsResponse = arrayEnvelope(bookingItemParticipantRecordSchema)
export const bookingDocumentsResponse = arrayEnvelope(bookingDocumentRecordSchema)
export const bookingGroupListResponse = paginatedEnvelope(bookingGroupRecordSchema)
export const bookingGroupSingleResponse = singleEnvelope(bookingGroupRecordSchema)
export const bookingGroupDetailResponse = singleEnvelope(bookingGroupDetailSchema)
export const bookingGroupMembersResponse = arrayEnvelope(bookingGroupMemberWithBookingSchema)
export const bookingGroupMemberSingleResponse = singleEnvelope(bookingGroupMemberRecordSchema)
export const bookingGroupForBookingSchema = bookingGroupRecordSchema.extend({
  membership: bookingGroupMemberRecordSchema,
})
export const bookingGroupForBookingResponse = z.object({
  data: bookingGroupForBookingSchema.nullable(),
})
export type BookingGroupForBookingRecord = z.infer<typeof bookingGroupForBookingSchema>
export const bookingPassengersResponse = arrayEnvelope(bookingPassengerRecordSchema)
export const bookingSupplierStatusesResponse = arrayEnvelope(bookingSupplierStatusRecordSchema)
export const bookingActivityResponse = arrayEnvelope(bookingActivityRecordSchema)
export const bookingNotesResponse = arrayEnvelope(bookingNoteRecordSchema)
export const publicBookingSessionResponse = singleEnvelope(publicBookingSessionSchema)
export const publicBookingSessionStateResponse = singleEnvelope(publicBookingSessionStateSchema)
export const publicBookingSessionRepriceResponse = singleEnvelope(
  publicBookingSessionRepriceResultSchema,
)
