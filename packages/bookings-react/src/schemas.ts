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

export const bookingListResponse = paginatedEnvelope(bookingRecordSchema)
export const bookingSingleResponse = singleEnvelope(bookingRecordSchema)
export const bookingPassengersResponse = arrayEnvelope(bookingPassengerRecordSchema)
export const bookingSupplierStatusesResponse = arrayEnvelope(bookingSupplierStatusRecordSchema)
export const bookingActivityResponse = arrayEnvelope(bookingActivityRecordSchema)
export const bookingNotesResponse = arrayEnvelope(bookingNoteRecordSchema)
