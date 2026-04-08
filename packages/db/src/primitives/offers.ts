import { z } from "zod"

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const OFFER_STATUSES = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "expired",
  "archived",
] as const
export type OfferStatus = (typeof OFFER_STATUSES)[number]

export const OFFER_DISCOUNT_TYPES = ["percentage", "fixed_amount"] as const
export type OfferDiscountType = (typeof OFFER_DISCOUNT_TYPES)[number]

export const OFFER_CHANNELS = ["website", "admin", "api", "marketplace"] as const
export type OfferChannel = (typeof OFFER_CHANNELS)[number]

export const OFFER_CUSTOMER_SEGMENTS = [
  "new",
  "returning",
  "vip",
  "loyalty_gold",
  "loyalty_silver",
  "loyalty_bronze",
] as const
export type OfferCustomerSegment = (typeof OFFER_CUSTOMER_SEGMENTS)[number]

// -----------------------------------------------------------------------------
// Condition Schemas (for JSONB conditions column)
// -----------------------------------------------------------------------------

/**
 * Condition: Booking window (days before departure)
 * Used for early bird / last minute deals
 */
export const bookingWindowConditionSchema = z.object({
  type: z.literal("booking_window"),
  minDaysBefore: z.number().int().min(0).optional(),
  maxDaysBefore: z.number().int().min(0).optional(),
})
export type BookingWindowCondition = z.infer<typeof bookingWindowConditionSchema>

/**
 * Condition: Minimum passengers
 * Used for group booking discounts
 */
export const minPaxConditionSchema = z.object({
  type: z.literal("min_pax"),
  minPassengers: z.number().int().min(1),
})
export type MinPaxCondition = z.infer<typeof minPaxConditionSchema>

/**
 * Condition: Booking date range
 * Offer applies when booking is made within date range
 */
export const bookingDateConditionSchema = z.object({
  type: z.literal("booking_date"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})
export type BookingDateCondition = z.infer<typeof bookingDateConditionSchema>

/**
 * Condition: Customer segments
 * Offer applies to specific customer types
 */
export const customerSegmentConditionSchema = z.object({
  type: z.literal("customer_segment"),
  segments: z.array(z.string()),
})
export type CustomerSegmentCondition = z.infer<typeof customerSegmentConditionSchema>

/**
 * Condition: Booking channels
 * Offer applies on specific booking channels
 */
export const channelConditionSchema = z.object({
  type: z.literal("channel"),
  channels: z.array(z.enum(OFFER_CHANNELS)),
})
export type ChannelCondition = z.infer<typeof channelConditionSchema>

/**
 * Condition: First-time customer
 * Offer only for new customers
 */
export const firstTimeCustomerConditionSchema = z.object({
  type: z.literal("first_time_customer"),
  enabled: z.boolean(),
})
export type FirstTimeCustomerCondition = z.infer<typeof firstTimeCustomerConditionSchema>

/**
 * Union of all condition types
 */
export const offerConditionSchema = z.discriminatedUnion("type", [
  bookingWindowConditionSchema,
  minPaxConditionSchema,
  bookingDateConditionSchema,
  customerSegmentConditionSchema,
  channelConditionSchema,
  firstTimeCustomerConditionSchema,
])
export type OfferCondition = z.infer<typeof offerConditionSchema>

/**
 * Full conditions object (array of conditions - all must match)
 */
export const offerConditionsSchema = z.object({
  conditions: z.array(offerConditionSchema).optional().default([]),
})
export type OfferConditions = z.infer<typeof offerConditionsSchema>

// -----------------------------------------------------------------------------
// Enum Schemas
// -----------------------------------------------------------------------------

export const offerStatusSchema = z.enum(OFFER_STATUSES)
export type OfferStatusSchema = z.infer<typeof offerStatusSchema>

export const offerDiscountTypeSchema = z.enum(OFFER_DISCOUNT_TYPES)
export type OfferDiscountTypeSchema = z.infer<typeof offerDiscountTypeSchema>

export const offerChannelSchema = z.enum(OFFER_CHANNELS)
export type OfferChannelSchema = z.infer<typeof offerChannelSchema>

export const offerCustomerSegmentSchema = z.enum(OFFER_CUSTOMER_SEGMENTS)
export type OfferCustomerSegmentSchema = z.infer<typeof offerCustomerSegmentSchema>

// -----------------------------------------------------------------------------
// Core Field Schemas
// -----------------------------------------------------------------------------

/**
 * Core offer fields schema - shared validation for common offer columns.
 * Used by both db-main and db-marketplace.
 */
export const offerCoreFieldsSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or less"),
  description: z.string().max(2000).nullable().optional(),
  badge: z.string().max(50).nullable().optional(),
  discountType: offerDiscountTypeSchema,
  discountValue: z.string().min(1, "Discount value is required"), // Stored as string for decimal precision
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").nullable().optional(), // Only required for fixed_amount
  applicableProductIds: z.array(z.string()).nullable().optional(),
  applicableDepartureIds: z.array(z.string()).nullable().optional(),
  validFrom: z.date().nullable().optional(),
  validTo: z.date().nullable().optional(),
  conditions: offerConditionsSchema.optional().default({ conditions: [] }),
  stackable: z.boolean().default(false),
  stackingGroup: z.string().max(100).nullable().optional(),
  priority: z.number().int().min(0).max(1000).default(100),
  isActive: z.boolean().default(true),
  displayPriority: z.number().int().default(0),
})
export type OfferCoreFields = z.infer<typeof offerCoreFieldsSchema>

/**
 * Timestamp fields for offers
 */
export const offerTimestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type OfferTimestamps = z.infer<typeof offerTimestampsSchema>
