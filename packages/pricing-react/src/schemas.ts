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

export const pricingCategoryRecordSchema = z.object({
  id: z.string(),
  productId: z.string().nullable(),
  optionId: z.string().nullable(),
  unitId: z.string().nullable(),
  code: z.string().nullable(),
  name: z.string(),
  categoryType: z.enum([
    "adult",
    "child",
    "infant",
    "senior",
    "group",
    "room",
    "vehicle",
    "service",
    "other",
  ]),
  seatOccupancy: z.number().int(),
  groupSize: z.number().int().nullable(),
  isAgeQualified: z.boolean(),
  minAge: z.number().int().nullable(),
  maxAge: z.number().int().nullable(),
  internalUseOnly: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type PricingCategoryRecord = z.infer<typeof pricingCategoryRecordSchema>

export const pricingCategoryDependencyRecordSchema = z.object({
  id: z.string(),
  pricingCategoryId: z.string(),
  masterPricingCategoryId: z.string(),
  dependencyType: z.enum(["requires", "limits_per_master", "limits_sum", "excludes"]),
  maxPerMaster: z.number().int().nullable(),
  maxDependentSum: z.number().int().nullable(),
  active: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type PricingCategoryDependencyRecord = z.infer<typeof pricingCategoryDependencyRecordSchema>

export const pricingCategoryListResponse = paginatedEnvelope(pricingCategoryRecordSchema)
export const pricingCategorySingleResponse = singleEnvelope(pricingCategoryRecordSchema)
export const pricingCategoryDependencyListResponse = paginatedEnvelope(
  pricingCategoryDependencyRecordSchema,
)
export const pricingCategoryDependencySingleResponse = singleEnvelope(
  pricingCategoryDependencyRecordSchema,
)
