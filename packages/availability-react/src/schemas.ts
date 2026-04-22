import {
  insertAvailabilityRuleSchema,
  insertAvailabilitySlotSchema,
  insertAvailabilityStartTimeSchema,
  updateAvailabilityRuleSchema,
  updateAvailabilitySlotSchema,
  updateAvailabilityStartTimeSchema,
} from "@voyantjs/availability"
import { z } from "zod"

export const paginatedEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })

export const singleEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: item })
export const successEnvelope = z.object({ success: z.boolean() })

export const productOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export type ProductOption = z.infer<typeof productOptionSchema>

export const availabilityRuleRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string().nullable().optional(),
  optionId: z.string().nullable(),
  facilityId: z.string().nullable(),
  timezone: z.string(),
  recurrenceRule: z.string(),
  maxCapacity: z.number().int(),
  maxPickupCapacity: z.number().int().nullable(),
  minTotalPax: z.number().int().nullable(),
  cutoffMinutes: z.number().int().nullable(),
  earlyBookingLimitMinutes: z.number().int().nullable(),
  active: z.boolean(),
})

export type AvailabilityRuleRecord = z.infer<typeof availabilityRuleRecordSchema>
export type AvailabilityRuleRow = AvailabilityRuleRecord

export const availabilityStartTimeRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string().nullable().optional(),
  optionId: z.string().nullable(),
  facilityId: z.string().nullable(),
  label: z.string().nullable(),
  startTimeLocal: z.string(),
  durationMinutes: z.number().int().nullable(),
  sortOrder: z.number().int(),
  active: z.boolean(),
})

export type AvailabilityStartTimeRecord = z.infer<typeof availabilityStartTimeRecordSchema>
export type AvailabilityStartTimeRow = AvailabilityStartTimeRecord

export const availabilitySlotRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string().nullable().optional(),
  itineraryId: z.string().nullable(),
  optionId: z.string().nullable(),
  facilityId: z.string().nullable(),
  availabilityRuleId: z.string().nullable(),
  startTimeId: z.string().nullable(),
  dateLocal: z.string(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  timezone: z.string(),
  status: z.enum(["open", "closed", "sold_out", "cancelled"]),
  unlimited: z.boolean(),
  initialPax: z.number().int().nullable(),
  remainingPax: z.number().int().nullable(),
  nights: z.number().int().nullable(),
  days: z.number().int().nullable(),
  notes: z.string().nullable(),
})

export type AvailabilitySlotRecord = z.infer<typeof availabilitySlotRecordSchema>
export type AvailabilitySlotRow = AvailabilitySlotRecord

export const availabilitySlotDetailSchema = availabilitySlotRecordSchema.extend({
  initialPickups: z.number().int().nullable(),
  remainingPickups: z.number().int().nullable(),
  remainingResources: z.number().int().nullable(),
  pastCutoff: z.boolean(),
  tooEarly: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type AvailabilitySlotDetail = z.infer<typeof availabilitySlotDetailSchema>

export const availabilityCloseoutRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string().nullable().optional(),
  slotId: z.string().nullable(),
  dateLocal: z.string(),
  reason: z.string().nullable(),
  createdBy: z.string().nullable(),
})

export type AvailabilityCloseoutRow = z.infer<typeof availabilityCloseoutRecordSchema>

export const availabilitySlotPickupRecordSchema = z.object({
  id: z.string(),
  slotId: z.string(),
  pickupPointId: z.string(),
  initialCapacity: z.number().int().nullable(),
  remainingCapacity: z.number().int().nullable(),
})

export type AvailabilitySlotPickupRow = z.infer<typeof availabilitySlotPickupRecordSchema>

export const availabilityPickupPointRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable(),
  locationText: z.string().nullable(),
  active: z.boolean(),
})

export type AvailabilityPickupPointRow = z.infer<typeof availabilityPickupPointRecordSchema>

export const bookingSummarySchema = z.object({
  id: z.string(),
  bookingNumber: z.string(),
})

export type BookingSummary = z.infer<typeof bookingSummarySchema>

export const resourceSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
})

export type ResourceSummary = z.infer<typeof resourceSummarySchema>

export const availabilitySlotAssignmentRecordSchema = z.object({
  id: z.string(),
  poolId: z.string().nullable(),
  resourceId: z.string().nullable(),
  bookingId: z.string().nullable(),
  status: z.enum(["reserved", "assigned", "released", "cancelled", "completed"]),
  assignedBy: z.string().nullable(),
  releasedAt: z.string().nullable(),
  notes: z.string().nullable(),
})

export type AvailabilitySlotAssignmentRow = z.infer<typeof availabilitySlotAssignmentRecordSchema>

export const productSingleResponse = z.object({
  data: productOptionSchema,
})

export const productListResponse = paginatedEnvelope(productOptionSchema)
export const availabilityRuleListResponse = paginatedEnvelope(availabilityRuleRecordSchema)
export const availabilityRuleSingleResponse = singleEnvelope(availabilityRuleRecordSchema)
export const availabilityStartTimeListResponse = paginatedEnvelope(
  availabilityStartTimeRecordSchema,
)
export const availabilityStartTimeSingleResponse = singleEnvelope(availabilityStartTimeRecordSchema)
export const availabilitySlotListResponse = paginatedEnvelope(availabilitySlotRecordSchema)
export const availabilitySlotRecordResponse = singleEnvelope(availabilitySlotRecordSchema)
export const availabilitySlotSingleResponse = singleEnvelope(availabilitySlotDetailSchema)
export const availabilityCloseoutListResponse = paginatedEnvelope(availabilityCloseoutRecordSchema)
export const availabilityPickupPointListResponse = paginatedEnvelope(
  availabilityPickupPointRecordSchema,
)
export const availabilitySlotPickupListResponse = paginatedEnvelope(
  availabilitySlotPickupRecordSchema,
)
export const availabilitySlotAssignmentListResponse = paginatedEnvelope(
  availabilitySlotAssignmentRecordSchema,
)
export const bookingSummaryListResponse = paginatedEnvelope(bookingSummarySchema)
export const resourceSummaryListResponse = paginatedEnvelope(resourceSummarySchema)

export {
  insertAvailabilityRuleSchema,
  insertAvailabilitySlotSchema,
  insertAvailabilityStartTimeSchema,
  updateAvailabilityRuleSchema,
  updateAvailabilitySlotSchema,
  updateAvailabilityStartTimeSchema,
}

export type CreateAvailabilityRuleInput = z.input<typeof insertAvailabilityRuleSchema>
export type UpdateAvailabilityRuleInput = z.input<typeof updateAvailabilityRuleSchema>
export type CreateAvailabilityStartTimeInput = z.input<typeof insertAvailabilityStartTimeSchema>
export type UpdateAvailabilityStartTimeInput = z.input<typeof updateAvailabilityStartTimeSchema>
export type CreateAvailabilitySlotInput = z.input<typeof insertAvailabilitySlotSchema>
export type UpdateAvailabilitySlotInput = z.input<typeof updateAvailabilitySlotSchema>
