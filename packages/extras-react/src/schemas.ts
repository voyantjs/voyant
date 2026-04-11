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

export const productExtraRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  code: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  selectionType: z.enum(["optional", "required", "default_selected", "unavailable"]),
  pricingMode: z.enum([
    "included",
    "per_person",
    "per_booking",
    "quantity_based",
    "on_request",
    "free",
  ]),
  pricedPerPerson: z.boolean(),
  minQuantity: z.number().int().nullable(),
  maxQuantity: z.number().int().nullable(),
  defaultQuantity: z.number().int().nullable(),
  active: z.boolean(),
  sortOrder: z.number().int(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ProductExtraRecord = z.infer<typeof productExtraRecordSchema>

export const productExtraListResponse = paginatedEnvelope(productExtraRecordSchema)
export const productExtraSingleResponse = singleEnvelope(productExtraRecordSchema)
