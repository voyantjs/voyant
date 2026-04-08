import { booleanQueryParam } from "@voyantjs/db/helpers"
import { typeIdSchema } from "@voyantjs/db/lib/typeid"
import { z } from "zod"

const productStatusSchema = z.enum(["draft", "active", "archived"])
const productOptionStatusSchema = z.enum(["draft", "active", "archived"])
const optionUnitTypeSchema = z.enum(["person", "group", "room", "vehicle", "service", "other"])
const productBookingModeSchema = z.enum([
  "date",
  "date_time",
  "open",
  "stay",
  "transfer",
  "itinerary",
  "other",
])
const productCapacityModeSchema = z.enum(["free_sale", "limited", "on_request"])
const productVisibilitySchema = z.enum(["public", "private", "hidden"])
const productActivationModeSchema = z.enum(["manual", "scheduled", "channel_controlled"])
const productTicketFulfillmentSchema = z.enum([
  "none",
  "per_booking",
  "per_participant",
  "per_item",
])
const productDeliveryFormatSchema = z.enum([
  "voucher",
  "ticket",
  "pdf",
  "qr_code",
  "barcode",
  "email",
  "mobile",
  "none",
])
const productCapabilitySchema = z.enum([
  "instant_confirmation",
  "on_request",
  "pickup_available",
  "dropoff_available",
  "guided",
  "private",
  "shared",
  "digital_ticket",
  "voucher_required",
  "external_inventory",
  "multi_day",
  "accommodation",
  "transport",
])
const productFeatureTypeSchema = z.enum([
  "inclusion",
  "exclusion",
  "highlight",
  "important_information",
  "other",
])
const productLocationTypeSchema = z.enum([
  "start",
  "end",
  "meeting_point",
  "pickup",
  "dropoff",
  "point_of_interest",
  "other",
])
const languageTagSchema = z
  .string()
  .min(2)
  .max(35)
  .regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/)

const serviceTypeSchema = z.enum([
  "accommodation",
  "transfer",
  "experience",
  "guide",
  "meal",
  "other",
])

// ---------- products ----------

const productCoreSchema = z.object({
  name: z.string().min(1).max(255),
  status: productStatusSchema.default("draft"),
  description: z.string().optional().nullable(),
  bookingMode: productBookingModeSchema.default("date"),
  capacityMode: productCapacityModeSchema.default("limited"),
  timezone: z.string().max(100).optional().nullable(),
  visibility: productVisibilitySchema.default("private"),
  activated: z.boolean().default(false),
  reservationTimeoutMinutes: z.number().int().min(0).optional().nullable(),
  sellCurrency: z.string().min(3).max(3),
  facilityId: z.string().optional().nullable(),
  productTypeId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  pax: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).default([]),
})

const productPricingFields = {
  sellAmountCents: z.number().int().min(0).optional().nullable(),
  costAmountCents: z.number().int().min(0).optional().nullable(),
  marginPercent: z.number().int().optional().nullable(),
}

export const insertProductSchema = productCoreSchema.extend(productPricingFields)
export const updateProductSchema = productCoreSchema.partial().extend(productPricingFields)

export const selectProductSchema = productCoreSchema.extend({
  id: typeIdSchema("products"),
  sellAmountCents: z.number().int().nullable(),
  costAmountCents: z.number().int().nullable(),
  marginPercent: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const productListQuerySchema = z.object({
  status: productStatusSchema.optional(),
  bookingMode: productBookingModeSchema.optional(),
  visibility: productVisibilitySchema.optional(),
  activated: booleanQueryParam.optional(),
  facilityId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertProduct = z.infer<typeof insertProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>
export type SelectProduct = z.infer<typeof selectProductSchema>

// ---------- product options ----------

const productOptionCoreSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  status: productOptionStatusSchema.default("draft"),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  availableFrom: z.string().optional().nullable(),
  availableTo: z.string().optional().nullable(),
})

export const insertProductOptionSchema = productOptionCoreSchema
export const updateProductOptionSchema = productOptionCoreSchema.partial()

export const productOptionListQuerySchema = z.object({
  productId: z.string().optional(),
  status: productOptionStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertProductOption = z.infer<typeof insertProductOptionSchema>
export type UpdateProductOption = z.infer<typeof updateProductOptionSchema>

// ---------- option units ----------

const optionUnitCoreSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  unitType: optionUnitTypeSchema.default("person"),
  minQuantity: z.number().int().min(0).optional().nullable(),
  maxQuantity: z.number().int().min(0).optional().nullable(),
  minAge: z.number().int().min(0).optional().nullable(),
  maxAge: z.number().int().min(0).optional().nullable(),
  occupancyMin: z.number().int().min(0).optional().nullable(),
  occupancyMax: z.number().int().min(0).optional().nullable(),
  isRequired: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})

export const insertOptionUnitSchema = optionUnitCoreSchema
export const updateOptionUnitSchema = optionUnitCoreSchema.partial()

export const optionUnitListQuerySchema = z.object({
  optionId: z.string().optional(),
  unitType: optionUnitTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertOptionUnit = z.infer<typeof insertOptionUnitSchema>
export type UpdateOptionUnit = z.infer<typeof updateOptionUnitSchema>

// ---------- product operating configuration ----------

const activationSettingsCoreSchema = z.object({
  activationMode: productActivationModeSchema.default("manual"),
  activateAt: z.string().datetime().optional().nullable(),
  deactivateAt: z.string().datetime().optional().nullable(),
  sellAt: z.string().datetime().optional().nullable(),
  stopSellAt: z.string().datetime().optional().nullable(),
})

const ticketSettingsCoreSchema = z.object({
  fulfillmentMode: productTicketFulfillmentSchema.default("none"),
  defaultDeliveryFormat: productDeliveryFormatSchema.default("none"),
  ticketPerUnit: z.boolean().default(false),
  barcodeFormat: z.string().max(100).optional().nullable(),
  voucherMessage: z.string().optional().nullable(),
  ticketMessage: z.string().optional().nullable(),
})

const visibilitySettingsCoreSchema = z.object({
  isSearchable: z.boolean().default(false),
  isBookable: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  requiresAuthentication: z.boolean().default(false),
})

const capabilityCoreSchema = z.object({
  capability: productCapabilitySchema,
  enabled: z.boolean().default(true),
  notes: z.string().optional().nullable(),
})

const deliveryFormatCoreSchema = z.object({
  format: productDeliveryFormatSchema,
  isDefault: z.boolean().default(false),
})

export const insertProductActivationSettingSchema = activationSettingsCoreSchema
export const updateProductActivationSettingSchema = activationSettingsCoreSchema.partial()
export const productActivationSettingListQuerySchema = z.object({
  productId: z.string().optional(),
  activationMode: productActivationModeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const insertProductTicketSettingSchema = ticketSettingsCoreSchema
export const updateProductTicketSettingSchema = ticketSettingsCoreSchema.partial()
export const productTicketSettingListQuerySchema = z.object({
  productId: z.string().optional(),
  fulfillmentMode: productTicketFulfillmentSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const insertProductVisibilitySettingSchema = visibilitySettingsCoreSchema
export const updateProductVisibilitySettingSchema = visibilitySettingsCoreSchema.partial()
export const productVisibilitySettingListQuerySchema = z.object({
  productId: z.string().optional(),
  isSearchable: booleanQueryParam.optional(),
  isBookable: booleanQueryParam.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const insertProductCapabilitySchema = capabilityCoreSchema
export const updateProductCapabilitySchema = capabilityCoreSchema.partial()
export const productCapabilityListQuerySchema = z.object({
  productId: z.string().optional(),
  capability: productCapabilitySchema.optional(),
  enabled: booleanQueryParam.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const insertProductDeliveryFormatSchema = deliveryFormatCoreSchema
export const updateProductDeliveryFormatSchema = deliveryFormatCoreSchema.partial()
export const productDeliveryFormatListQuerySchema = z.object({
  productId: z.string().optional(),
  format: productDeliveryFormatSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertProductActivationSetting = z.infer<typeof insertProductActivationSettingSchema>
export type UpdateProductActivationSetting = z.infer<typeof updateProductActivationSettingSchema>
export type InsertProductTicketSetting = z.infer<typeof insertProductTicketSettingSchema>
export type UpdateProductTicketSetting = z.infer<typeof updateProductTicketSettingSchema>
export type InsertProductVisibilitySetting = z.infer<typeof insertProductVisibilitySettingSchema>
export type UpdateProductVisibilitySetting = z.infer<typeof updateProductVisibilitySettingSchema>
export type InsertProductCapability = z.infer<typeof insertProductCapabilitySchema>
export type UpdateProductCapability = z.infer<typeof updateProductCapabilitySchema>
export type InsertProductDeliveryFormat = z.infer<typeof insertProductDeliveryFormatSchema>
export type UpdateProductDeliveryFormat = z.infer<typeof updateProductDeliveryFormatSchema>

// ---------- structured content ----------

const productFeatureCoreSchema = z.object({
  featureType: productFeatureTypeSchema.default("highlight"),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
})

const productFaqCoreSchema = z.object({
  question: z.string().min(1).max(1000),
  answer: z.string().min(1).max(10000),
  sortOrder: z.number().int().default(0),
})

const productLocationCoreSchema = z.object({
  locationType: productLocationTypeSchema.default("point_of_interest"),
  title: z.string().min(1).max(255),
  address: z.string().max(1000).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  countryCode: z.string().min(2).max(2).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  googlePlaceId: z.string().max(255).optional().nullable(),
  applePlaceId: z.string().max(255).optional().nullable(),
  tripadvisorLocationId: z.string().max(255).optional().nullable(),
  sortOrder: z.number().int().default(0),
})

export const insertProductFeatureSchema = productFeatureCoreSchema
export const updateProductFeatureSchema = productFeatureCoreSchema.partial()
export const productFeatureListQuerySchema = z.object({
  productId: z.string().optional(),
  featureType: productFeatureTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const insertProductFaqSchema = productFaqCoreSchema
export const updateProductFaqSchema = productFaqCoreSchema.partial()
export const productFaqListQuerySchema = z.object({
  productId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const insertProductLocationSchema = productLocationCoreSchema
export const updateProductLocationSchema = productLocationCoreSchema.partial()
export const productLocationListQuerySchema = z.object({
  productId: z.string().optional(),
  locationType: productLocationTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertProductFeature = z.infer<typeof insertProductFeatureSchema>
export type UpdateProductFeature = z.infer<typeof updateProductFeatureSchema>
export type InsertProductFaq = z.infer<typeof insertProductFaqSchema>
export type UpdateProductFaq = z.infer<typeof updateProductFaqSchema>
export type InsertProductLocation = z.infer<typeof insertProductLocationSchema>
export type UpdateProductLocation = z.infer<typeof updateProductLocationSchema>

// ---------- translations ----------

const productTranslationCoreSchema = z.object({
  languageTag: languageTagSchema,
  slug: z.string().max(255).optional().nullable(),
  name: z.string().min(1).max(255),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  seoTitle: z.string().max(255).optional().nullable(),
  seoDescription: z.string().optional().nullable(),
})

const optionTranslationCoreSchema = z.object({
  languageTag: languageTagSchema,
  name: z.string().min(1).max(255),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export const insertProductTranslationSchema = productTranslationCoreSchema
export const updateProductTranslationSchema = productTranslationCoreSchema.partial()
export const productTranslationListQuerySchema = z.object({
  productId: z.string().optional(),
  languageTag: languageTagSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const insertProductOptionTranslationSchema = optionTranslationCoreSchema
export const updateProductOptionTranslationSchema = optionTranslationCoreSchema.partial()
export const productOptionTranslationListQuerySchema = z.object({
  optionId: z.string().optional(),
  languageTag: languageTagSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const insertOptionUnitTranslationSchema = optionTranslationCoreSchema
export const updateOptionUnitTranslationSchema = optionTranslationCoreSchema.partial()
export const optionUnitTranslationListQuerySchema = z.object({
  unitId: z.string().optional(),
  languageTag: languageTagSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertProductTranslation = z.infer<typeof insertProductTranslationSchema>
export type UpdateProductTranslation = z.infer<typeof updateProductTranslationSchema>
export type InsertProductOptionTranslation = z.infer<typeof insertProductOptionTranslationSchema>
export type UpdateProductOptionTranslation = z.infer<typeof updateProductOptionTranslationSchema>
export type InsertOptionUnitTranslation = z.infer<typeof insertOptionUnitTranslationSchema>
export type UpdateOptionUnitTranslation = z.infer<typeof updateOptionUnitTranslationSchema>

// ---------- days ----------

const dayCoreSchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
})

export const insertDaySchema = dayCoreSchema
export const updateDaySchema = dayCoreSchema.partial()

export type InsertDay = z.infer<typeof insertDaySchema>
export type UpdateDay = z.infer<typeof updateDaySchema>

// ---------- day services ----------

const dayServiceCoreSchema = z.object({
  serviceType: serviceTypeSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  supplierServiceId: z.string().optional().nullable(),
  costCurrency: z.string().min(3).max(3),
  costAmountCents: z.number().int().min(0),
  quantity: z.number().int().positive().default(1),
  sortOrder: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const insertDayServiceSchema = dayServiceCoreSchema
export const updateDayServiceSchema = dayServiceCoreSchema.partial()

export type InsertDayService = z.infer<typeof insertDayServiceSchema>
export type UpdateDayService = z.infer<typeof updateDayServiceSchema>

// ---------- versions ----------

export const insertVersionSchema = z.object({
  notes: z.string().max(10000).optional().nullable(),
})

export type InsertVersion = z.infer<typeof insertVersionSchema>

// ---------- notes ----------

export const insertProductNoteSchema = z.object({
  content: z.string().min(1).max(10000),
})

// ---------- product media ----------

const productMediaTypeSchema = z.enum(["image", "video", "document"])

const productMediaCoreSchema = z.object({
  mediaType: productMediaTypeSchema,
  name: z.string().min(1).max(500),
  url: z.string().min(1).max(2048),
  storageKey: z.string().max(1024).optional().nullable(),
  mimeType: z.string().max(255).optional().nullable(),
  fileSize: z.number().int().min(0).optional().nullable(),
  altText: z.string().max(1000).optional().nullable(),
  sortOrder: z.number().int().default(0),
  isCover: z.boolean().default(false),
})

export const insertProductMediaSchema = productMediaCoreSchema.extend({
  dayId: z.string().optional().nullable(),
})
export const updateProductMediaSchema = productMediaCoreSchema.partial()

export const productMediaListQuerySchema = z.object({
  dayId: z.string().optional(),
  mediaType: productMediaTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const reorderProductMediaSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int(),
    }),
  ),
})

export type InsertProductMedia = z.infer<typeof insertProductMediaSchema>
export type UpdateProductMedia = z.infer<typeof updateProductMediaSchema>
export type ProductMediaListQuery = z.infer<typeof productMediaListQuerySchema>
export type ReorderProductMedia = z.infer<typeof reorderProductMediaSchema>

// ---------- product types ----------

const productTypeCoreSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const insertProductTypeSchema = productTypeCoreSchema
export const updateProductTypeSchema = productTypeCoreSchema.partial()
export const productTypeListQuerySchema = z.object({
  active: booleanQueryParam.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertProductType = z.infer<typeof insertProductTypeSchema>
export type UpdateProductType = z.infer<typeof updateProductTypeSchema>

// ---------- product categories ----------

const productCategoryCoreSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  parentId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const insertProductCategorySchema = productCategoryCoreSchema
export const updateProductCategorySchema = productCategoryCoreSchema.partial()
export const productCategoryListQuerySchema = z.object({
  parentId: z.string().optional(),
  active: booleanQueryParam.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>
export type UpdateProductCategory = z.infer<typeof updateProductCategorySchema>

// ---------- product tags ----------

const productTagCoreSchema = z.object({
  name: z.string().min(1).max(255),
})

export const insertProductTagSchema = productTagCoreSchema
export const updateProductTagSchema = productTagCoreSchema.partial()
export const productTagListQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertProductTag = z.infer<typeof insertProductTagSchema>
export type UpdateProductTag = z.infer<typeof updateProductTagSchema>
