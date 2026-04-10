import {
  booleanQueryParam,
  languageTagSchema,
  productFeatureTypeSchema,
  productLocationTypeSchema,
  serviceTypeSchema,
  z,
} from "./validation-shared.js"

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
  items: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })),
})
export type InsertProductMedia = z.infer<typeof insertProductMediaSchema>
export type UpdateProductMedia = z.infer<typeof updateProductMediaSchema>
export type ProductMediaListQuery = z.infer<typeof productMediaListQuerySchema>
export type ReorderProductMedia = z.infer<typeof reorderProductMediaSchema>

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
