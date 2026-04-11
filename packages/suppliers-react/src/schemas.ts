import { z } from "zod"

export const paginatedEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })

export const supplierTypeSchema = z.enum([
  "hotel",
  "transfer",
  "guide",
  "experience",
  "airline",
  "restaurant",
  "other",
])

export const supplierStatusSchema = z.enum(["active", "inactive", "pending"])

export const serviceTypeSchema = z.enum([
  "accommodation",
  "transfer",
  "experience",
  "guide",
  "meal",
  "other",
])

export const rateUnitSchema = z.enum([
  "per_person",
  "per_group",
  "per_night",
  "per_vehicle",
  "flat",
])

export const supplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: supplierTypeSchema,
  status: supplierStatusSchema,
  description: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  defaultCurrency: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Supplier = z.infer<typeof supplierSchema>

export const supplierServiceSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  serviceType: serviceTypeSchema,
  name: z.string(),
  description: z.string().nullable(),
  duration: z.string().nullable(),
  capacity: z.number().int().nullable(),
  active: z.boolean(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type SupplierService = z.infer<typeof supplierServiceSchema>

export const supplierRateSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  name: z.string(),
  currency: z.string(),
  amountCents: z.number().int(),
  unit: rateUnitSchema,
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  minPax: z.number().int().nullable(),
  maxPax: z.number().int().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
})

export type SupplierRate = z.infer<typeof supplierRateSchema>

export const supplierNoteSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  authorId: z.string(),
  content: z.string(),
  createdAt: z.string(),
})

export type SupplierNote = z.infer<typeof supplierNoteSchema>

export const supplierListResponse = paginatedEnvelope(supplierSchema)
export const supplierDetailResponse = z.object({ data: supplierSchema })
export const supplierServiceResponse = z.object({ data: supplierServiceSchema })
export const supplierServicesResponse = z.object({ data: z.array(supplierServiceSchema) })
export const supplierNoteResponse = z.object({ data: supplierNoteSchema })
export const supplierNotesResponse = z.object({ data: z.array(supplierNoteSchema) })
export const supplierRateResponse = z.object({ data: supplierRateSchema })
export const supplierRatesResponse = z.object({ data: z.array(supplierRateSchema) })
export const deleteSuccessResponse = z.object({ success: z.boolean() })
