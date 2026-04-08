import { z } from "zod"

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

const isoDateSchema = z.string().date()
const productStatusSchema = z.enum(["draft", "active", "archived"])
const productBookingModeSchema = z.enum([
  "date",
  "date_time",
  "open",
  "stay",
  "transfer",
  "itinerary",
  "other",
])
const productVisibilitySchema = z.enum(["public", "private", "hidden"])
const bookingStatusSchema = z.enum([
  "draft",
  "on_hold",
  "confirmed",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
])

export const octoProductListQuerySchema = paginationSchema.extend({
  status: productStatusSchema.optional(),
  bookingMode: productBookingModeSchema.optional(),
  visibility: productVisibilitySchema.optional(),
  activated: z.coerce.boolean().optional(),
  facilityId: z.string().optional(),
  search: z.string().optional(),
})

export const octoBookingListQuerySchema = paginationSchema.extend({
  status: bookingStatusSchema.optional(),
  search: z.string().optional(),
})

export const octoAvailabilityListQuerySchema = paginationSchema
  .extend({
    productId: z.string().optional(),
    optionId: z.string().optional(),
    localDateStart: isoDateSchema.optional(),
    localDateEnd: isoDateSchema.optional(),
  })
  .refine(
    (value) =>
      !value.localDateStart ||
      !value.localDateEnd ||
      value.localDateStart <= value.localDateEnd,
    {
      message: "localDateStart must be before or equal to localDateEnd",
      path: ["localDateEnd"],
    },
  )

export const octoAvailabilityCalendarQuerySchema = z
  .object({
    optionId: z.string().optional(),
    localDateStart: isoDateSchema.optional(),
    localDateEnd: isoDateSchema.optional(),
  })
  .refine(
    (value) =>
      !value.localDateStart ||
      !value.localDateEnd ||
      value.localDateStart <= value.localDateEnd,
    {
      message: "localDateStart must be before or equal to localDateEnd",
      path: ["localDateEnd"],
    },
  )
