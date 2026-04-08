import { z } from "zod"

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

const moneySchema = z.number().int().nullable().optional()

export const offerStatusSchema = z.enum([
  "draft",
  "published",
  "sent",
  "accepted",
  "expired",
  "withdrawn",
  "converted",
])

export const orderStatusSchema = z.enum([
  "draft",
  "pending",
  "confirmed",
  "fulfilled",
  "cancelled",
  "expired",
])

export const transactionParticipantTypeSchema = z.enum([
  "traveler",
  "booker",
  "contact",
  "occupant",
  "staff",
  "other",
])

export const transactionTravelerCategorySchema = z.enum([
  "adult",
  "child",
  "infant",
  "senior",
  "other",
])

export const transactionItemTypeSchema = z.enum([
  "unit",
  "service",
  "extra",
  "fee",
  "tax",
  "discount",
  "adjustment",
  "accommodation",
  "transport",
  "other",
])

export const transactionItemStatusSchema = z.enum([
  "draft",
  "priced",
  "confirmed",
  "cancelled",
  "fulfilled",
])

export const transactionItemParticipantRoleSchema = z.enum([
  "traveler",
  "occupant",
  "primary_contact",
  "beneficiary",
  "service_assignee",
  "other",
])

export const orderTermTypeSchema = z.enum([
  "terms_and_conditions",
  "cancellation",
  "guarantee",
  "payment",
  "pricing",
  "commission",
  "other",
])

export const orderTermAcceptanceStatusSchema = z.enum([
  "not_required",
  "pending",
  "accepted",
  "declined",
])

const offerCoreSchema = z.object({
  offerNumber: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  status: offerStatusSchema.default("draft"),
  personId: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional(),
  opportunityId: z.string().nullable().optional(),
  quoteId: z.string().nullable().optional(),
  marketId: z.string().nullable().optional(),
  sourceChannelId: z.string().nullable().optional(),
  currency: z.string().length(3),
  baseCurrency: z.string().length(3).nullable().optional(),
  fxRateSetId: z.string().nullable().optional(),
  subtotalAmountCents: z.number().int().min(0).default(0),
  taxAmountCents: z.number().int().min(0).default(0),
  feeAmountCents: z.number().int().min(0).default(0),
  totalAmountCents: z.number().int().min(0).default(0),
  costAmountCents: z.number().int().min(0).default(0),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  sentAt: z.string().nullable().optional(),
  acceptedAt: z.string().nullable().optional(),
  convertedAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

const participantCoreSchema = z.object({
  personId: z.string().nullable().optional(),
  participantType: transactionParticipantTypeSchema.default("traveler"),
  travelerCategory: transactionTravelerCategorySchema.nullable().optional(),
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  preferredLanguage: z.string().max(35).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  nationality: z.string().max(2).nullable().optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().nullable().optional(),
})

const itemCoreSchema = z.object({
  productId: z.string().nullable().optional(),
  optionId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  slotId: z.string().nullable().optional(),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  itemType: transactionItemTypeSchema.default("unit"),
  status: transactionItemStatusSchema.default("draft"),
  serviceDate: z.string().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  quantity: z.number().int().positive().default(1),
  sellCurrency: z.string().length(3),
  unitSellAmountCents: moneySchema,
  totalSellAmountCents: moneySchema,
  taxAmountCents: moneySchema,
  feeAmountCents: moneySchema,
  costCurrency: z.string().length(3).nullable().optional(),
  unitCostAmountCents: moneySchema,
  totalCostAmountCents: moneySchema,
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

const itemParticipantCoreSchema = z.object({
  participantId: z.string(),
  role: transactionItemParticipantRoleSchema.default("traveler"),
  isPrimary: z.boolean().default(false),
})

const orderCoreSchema = z.object({
  orderNumber: z.string().min(1).max(50),
  offerId: z.string().nullable().optional(),
  title: z.string().min(1).max(255),
  status: orderStatusSchema.default("draft"),
  personId: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional(),
  opportunityId: z.string().nullable().optional(),
  quoteId: z.string().nullable().optional(),
  marketId: z.string().nullable().optional(),
  sourceChannelId: z.string().nullable().optional(),
  currency: z.string().length(3),
  baseCurrency: z.string().length(3).nullable().optional(),
  fxRateSetId: z.string().nullable().optional(),
  subtotalAmountCents: z.number().int().min(0).default(0),
  taxAmountCents: z.number().int().min(0).default(0),
  feeAmountCents: z.number().int().min(0).default(0),
  totalAmountCents: z.number().int().min(0).default(0),
  costAmountCents: z.number().int().min(0).default(0),
  orderedAt: z.string().nullable().optional(),
  confirmedAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

const orderItemCoreSchema = itemCoreSchema.extend({
  offerItemId: z.string().nullable().optional(),
})

const orderTermCoreSchema = z.object({
  offerId: z.string().nullable().optional(),
  orderId: z.string().nullable().optional(),
  termType: orderTermTypeSchema.default("terms_and_conditions"),
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  language: z.string().max(35).nullable().optional(),
  required: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  acceptanceStatus: orderTermAcceptanceStatusSchema.default("pending"),
  acceptedAt: z.string().nullable().optional(),
  acceptedBy: z.string().max(255).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

const orderTermRequiredParentSchema = orderTermCoreSchema.refine(
  (value) => Boolean(value.offerId || value.orderId),
  {
    message: "offerId or orderId is required",
    path: ["offerId"],
  },
)

export const insertOfferSchema = offerCoreSchema
export const updateOfferSchema = offerCoreSchema.partial()
export const offerListQuerySchema = paginationSchema.extend({
  status: offerStatusSchema.optional(),
  opportunityId: z.string().optional(),
  quoteId: z.string().optional(),
  personId: z.string().optional(),
  organizationId: z.string().optional(),
  marketId: z.string().optional(),
  search: z.string().optional(),
})

export const insertOfferParticipantSchema = participantCoreSchema.extend({
  offerId: z.string(),
})
export const updateOfferParticipantSchema = participantCoreSchema.partial()
export const offerParticipantListQuerySchema = paginationSchema.extend({
  offerId: z.string().optional(),
  personId: z.string().optional(),
})

export const insertOfferItemSchema = itemCoreSchema.extend({
  offerId: z.string(),
})
export const updateOfferItemSchema = itemCoreSchema.partial()
export const offerItemListQuerySchema = paginationSchema.extend({
  offerId: z.string().optional(),
  productId: z.string().optional(),
  optionId: z.string().optional(),
  unitId: z.string().optional(),
  slotId: z.string().optional(),
  status: transactionItemStatusSchema.optional(),
})

export const insertOfferItemParticipantSchema = itemParticipantCoreSchema.extend({
  offerItemId: z.string(),
})
export const updateOfferItemParticipantSchema = itemParticipantCoreSchema.partial()
export const offerItemParticipantListQuerySchema = paginationSchema.extend({
  offerItemId: z.string().optional(),
  participantId: z.string().optional(),
})

export const insertOrderSchema = orderCoreSchema
export const updateOrderSchema = orderCoreSchema.partial()
export const orderListQuerySchema = paginationSchema.extend({
  status: orderStatusSchema.optional(),
  offerId: z.string().optional(),
  opportunityId: z.string().optional(),
  quoteId: z.string().optional(),
  personId: z.string().optional(),
  organizationId: z.string().optional(),
  marketId: z.string().optional(),
  search: z.string().optional(),
})

export const insertOrderParticipantSchema = participantCoreSchema.extend({
  orderId: z.string(),
})
export const updateOrderParticipantSchema = participantCoreSchema.partial()
export const orderParticipantListQuerySchema = paginationSchema.extend({
  orderId: z.string().optional(),
  personId: z.string().optional(),
})

export const insertOrderItemSchema = orderItemCoreSchema.extend({
  orderId: z.string(),
})
export const updateOrderItemSchema = orderItemCoreSchema.partial()
export const orderItemListQuerySchema = paginationSchema.extend({
  orderId: z.string().optional(),
  offerItemId: z.string().optional(),
  productId: z.string().optional(),
  optionId: z.string().optional(),
  unitId: z.string().optional(),
  slotId: z.string().optional(),
  status: transactionItemStatusSchema.optional(),
})

export const insertOrderItemParticipantSchema = itemParticipantCoreSchema.extend({
  orderItemId: z.string(),
})
export const updateOrderItemParticipantSchema = itemParticipantCoreSchema.partial()
export const orderItemParticipantListQuerySchema = paginationSchema.extend({
  orderItemId: z.string().optional(),
  participantId: z.string().optional(),
})

export const insertOrderTermSchema = orderTermRequiredParentSchema
export const updateOrderTermSchema = orderTermCoreSchema.partial()
export const orderTermListQuerySchema = paginationSchema.extend({
  offerId: z.string().optional(),
  orderId: z.string().optional(),
  termType: orderTermTypeSchema.optional(),
  acceptanceStatus: orderTermAcceptanceStatusSchema.optional(),
})
