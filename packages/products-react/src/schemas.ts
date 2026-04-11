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

export const productRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["draft", "active", "archived"]),
  description: z.string().nullable(),
  bookingMode: z.enum(["date", "date_time", "open", "stay", "transfer", "itinerary", "other"]),
  capacityMode: z.enum(["free_sale", "limited", "on_request"]),
  timezone: z.string().nullable(),
  visibility: z.enum(["public", "private", "hidden"]),
  activated: z.boolean(),
  reservationTimeoutMinutes: z.number().int().nullable(),
  sellCurrency: z.string(),
  sellAmountCents: z.number().int().nullable(),
  costAmountCents: z.number().int().nullable(),
  marginPercent: z.number().int().nullable(),
  facilityId: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  pax: z.number().int().nullable(),
  productTypeId: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ProductRecord = z.infer<typeof productRecordSchema>

export const productTypeRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  active: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ProductTypeRecord = z.infer<typeof productTypeRecordSchema>

export const productCategoryRecordSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  active: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ProductCategoryRecord = z.infer<typeof productCategoryRecordSchema>

export const productTagRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ProductTagRecord = z.infer<typeof productTagRecordSchema>

export const productOptionRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  description: z.string().nullable(),
  status: z.enum(["draft", "active", "archived"]),
  isDefault: z.boolean(),
  sortOrder: z.number().int(),
  availableFrom: z.string().nullable(),
  availableTo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ProductOptionRecord = z.infer<typeof productOptionRecordSchema>

export const optionUnitRecordSchema = z.object({
  id: z.string(),
  optionId: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  description: z.string().nullable(),
  unitType: z.enum(["person", "group", "room", "vehicle", "service", "other"]),
  minQuantity: z.number().int().nullable(),
  maxQuantity: z.number().int().nullable(),
  minAge: z.number().int().nullable(),
  maxAge: z.number().int().nullable(),
  occupancyMin: z.number().int().nullable(),
  occupancyMax: z.number().int().nullable(),
  isRequired: z.boolean(),
  isHidden: z.boolean(),
  sortOrder: z.number().int(),
})

export type OptionUnitRecord = z.infer<typeof optionUnitRecordSchema>

export const productListResponse = paginatedEnvelope(productRecordSchema)
export const productSingleResponse = singleEnvelope(productRecordSchema)
export const productTypeListResponse = paginatedEnvelope(productTypeRecordSchema)
export const productTypeSingleResponse = singleEnvelope(productTypeRecordSchema)
export const productCategoryListResponse = paginatedEnvelope(productCategoryRecordSchema)
export const productCategorySingleResponse = singleEnvelope(productCategoryRecordSchema)
export const productTagListResponse = paginatedEnvelope(productTagRecordSchema)
export const productTagSingleResponse = singleEnvelope(productTagRecordSchema)
export const productOptionListResponse = paginatedEnvelope(productOptionRecordSchema)
export const productOptionSingleResponse = singleEnvelope(productOptionRecordSchema)
export const optionUnitListResponse = paginatedEnvelope(optionUnitRecordSchema)
export const optionUnitSingleResponse = singleEnvelope(optionUnitRecordSchema)
