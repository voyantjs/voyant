import { z } from "zod"

const bookingStatusSchema = z.enum([
  "draft",
  "on_hold",
  "confirmed",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
])

const bookingParticipantTypeSchema = z.enum([
  "traveler",
  "booker",
  "contact",
  "occupant",
  "staff",
  "other",
])

const bookingItemTypeSchema = z.enum([
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

const bookingItemStatusSchema = z.enum([
  "draft",
  "on_hold",
  "confirmed",
  "cancelled",
  "expired",
  "fulfilled",
])

const bookingItemParticipantRoleSchema = z.enum([
  "traveler",
  "occupant",
  "primary_contact",
  "service_assignee",
  "beneficiary",
  "other",
])

const bookingDocumentTypeSchema = z.enum(["visa", "insurance", "health", "passport_copy", "other"])

const bookingFulfillmentTypeSchema = z.enum([
  "voucher",
  "ticket",
  "pdf",
  "qr_code",
  "barcode",
  "mobile",
  "other",
])

const bookingFulfillmentDeliveryChannelSchema = z.enum([
  "download",
  "email",
  "api",
  "wallet",
  "other",
])

const bookingFulfillmentStatusSchema = z.enum([
  "pending",
  "issued",
  "reissued",
  "revoked",
  "failed",
])

const seatingPreferenceSchema = z.enum(["aisle", "window", "middle", "no_preference"])

export const customerPortalRecordSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  preferredLanguage: z.string().nullable(),
  preferredCurrency: z.string().nullable(),
  birthday: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  relation: z.string().nullable(),
  status: z.string(),
})

export const customerPortalBootstrapCandidateSchema = customerPortalRecordSchema.extend({
  linkable: z.boolean(),
  claimedByAnotherUser: z.boolean(),
})

export const customerPortalProfileSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  locale: z.string(),
  timezone: z.string().nullable(),
  seatingPreference: seatingPreferenceSchema.nullable(),
  marketingConsent: z.boolean(),
  marketingConsentAt: z.string().nullable(),
  notificationDefaults: z.record(z.string(), z.unknown()).nullable(),
  uiPrefs: z.record(z.string(), z.unknown()).nullable(),
  customerRecord: customerPortalRecordSchema.nullable(),
})

export const updateCustomerPortalRecordSchema = z.object({
  preferredLanguage: z.string().max(35).nullable().optional(),
  preferredCurrency: z.string().min(3).max(3).nullable().optional(),
  birthday: z.string().date().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
})

export const updateCustomerPortalProfileSchema = z
  .object({
    firstName: z.string().max(200).nullable().optional(),
    lastName: z.string().max(200).nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    locale: z.string().max(10).optional(),
    timezone: z.string().max(64).nullable().optional(),
    seatingPreference: seatingPreferenceSchema.nullable().optional(),
    marketingConsent: z.boolean().optional(),
    notificationDefaults: z.record(z.string(), z.unknown()).nullable().optional(),
    uiPrefs: z.record(z.string(), z.unknown()).nullable().optional(),
    customerRecord: updateCustomerPortalRecordSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  })

export const customerPortalContactExistsQuerySchema = z.object({
  email: z.string().email(),
})

export const customerPortalContactExistsResultSchema = z.object({
  email: z.string().email(),
  authAccountExists: z.boolean(),
  customerRecordExists: z.boolean(),
  linkedCustomerRecordExists: z.boolean(),
})

export const bootstrapCustomerPortalSchema = z
  .object({
    customerRecordId: z.string().optional(),
    createCustomerIfMissing: z.boolean().default(true),
    firstName: z.string().max(200).nullable().optional(),
    lastName: z.string().max(200).nullable().optional(),
    marketingConsent: z.boolean().optional(),
    customerRecord: updateCustomerPortalRecordSchema.optional(),
  })
  .refine((value) => value.customerRecordId || value.createCustomerIfMissing !== false, {
    message: "Provide a customerRecordId or allow customer creation",
  })

export const bootstrapCustomerPortalResultSchema = z.object({
  status: z.enum([
    "already_linked",
    "linked_existing_customer",
    "created_customer",
    "customer_selection_required",
  ]),
  profile: customerPortalProfileSchema.nullable(),
  candidates: z.array(customerPortalBootstrapCandidateSchema).default([]),
})

export const customerPortalCompanionSchema = z.object({
  id: z.string(),
  role: z.string(),
  name: z.string(),
  title: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  isPrimary: z.boolean(),
  notes: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
})

export const createCustomerPortalCompanionSchema = z.object({
  role: z
    .enum([
      "general",
      "primary",
      "reservations",
      "operations",
      "front_desk",
      "sales",
      "emergency",
      "accounting",
      "legal",
      "other",
    ])
    .default("other"),
  name: z.string().min(1).max(255),
  title: z.string().max(255).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const updateCustomerPortalCompanionSchema = createCustomerPortalCompanionSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  })

export const customerPortalBookingSummarySchema = z.object({
  bookingId: z.string(),
  bookingNumber: z.string(),
  status: bookingStatusSchema,
  sellCurrency: z.string(),
  sellAmountCents: z.number().int().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  pax: z.number().int().nullable(),
  confirmedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  participantCount: z.number().int(),
  primaryTravelerName: z.string().nullable(),
})

export const customerPortalBookingItemParticipantSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  role: bookingItemParticipantRoleSchema,
  isPrimary: z.boolean(),
})

export const customerPortalBookingItemSchema = z.object({
  id: z.string(),
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
  notes: z.string().nullable(),
  participantLinks: z.array(customerPortalBookingItemParticipantSchema),
})

export const customerPortalBookingParticipantSchema = z.object({
  id: z.string(),
  participantType: bookingParticipantTypeSchema,
  firstName: z.string(),
  lastName: z.string(),
  isPrimary: z.boolean(),
})

export const customerPortalBookingDocumentSchema = z.object({
  id: z.string(),
  participantId: z.string().nullable(),
  type: bookingDocumentTypeSchema,
  fileName: z.string(),
  fileUrl: z.string(),
})

export const customerPortalBookingFulfillmentSchema = z.object({
  id: z.string(),
  bookingItemId: z.string().nullable(),
  participantId: z.string().nullable(),
  fulfillmentType: bookingFulfillmentTypeSchema,
  deliveryChannel: bookingFulfillmentDeliveryChannelSchema,
  status: bookingFulfillmentStatusSchema,
  artifactUrl: z.string().nullable(),
})

export const customerPortalBookingDetailSchema = z.object({
  bookingId: z.string(),
  bookingNumber: z.string(),
  status: bookingStatusSchema,
  sellCurrency: z.string(),
  sellAmountCents: z.number().int().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  pax: z.number().int().nullable(),
  confirmedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  participants: z.array(customerPortalBookingParticipantSchema),
  items: z.array(customerPortalBookingItemSchema),
  documents: z.array(customerPortalBookingDocumentSchema),
  fulfillments: z.array(customerPortalBookingFulfillmentSchema),
})

export type CustomerPortalProfile = z.infer<typeof customerPortalProfileSchema>
export type UpdateCustomerPortalProfileInput = z.infer<typeof updateCustomerPortalProfileSchema>
export type CustomerPortalContactExistsQuery = z.infer<
  typeof customerPortalContactExistsQuerySchema
>
export type CustomerPortalContactExistsResult = z.infer<
  typeof customerPortalContactExistsResultSchema
>
export type BootstrapCustomerPortalInput = z.infer<typeof bootstrapCustomerPortalSchema>
export type BootstrapCustomerPortalResult = z.infer<typeof bootstrapCustomerPortalResultSchema>
export type CustomerPortalBootstrapCandidate = z.infer<
  typeof customerPortalBootstrapCandidateSchema
>
export type CustomerPortalCompanion = z.infer<typeof customerPortalCompanionSchema>
export type CreateCustomerPortalCompanionInput = z.infer<typeof createCustomerPortalCompanionSchema>
export type UpdateCustomerPortalCompanionInput = z.infer<typeof updateCustomerPortalCompanionSchema>
export type CustomerPortalBookingSummary = z.infer<typeof customerPortalBookingSummarySchema>
export type CustomerPortalBookingDocument = z.infer<typeof customerPortalBookingDocumentSchema>
export type CustomerPortalBookingDetail = z.infer<typeof customerPortalBookingDetailSchema>
