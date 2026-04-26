import {
  cruiseStatusSchema,
  cruiseTypeSchema,
  externalRefsSchema,
  isoDateSchema,
  sailingSalesStatusSchema,
  slugSchema,
  z,
} from "./validation-shared.js"

const cruiseCoreSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(255),
  cruiseType: cruiseTypeSchema,
  lineSupplierId: z.string().optional().nullable(),
  defaultShipId: z.string().optional().nullable(),
  nights: z.number().int().positive(),
  embarkPortFacilityId: z.string().optional().nullable(),
  disembarkPortFacilityId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  highlights: z.array(z.string()).default([]),
  inclusionsHtml: z.string().optional().nullable(),
  exclusionsHtml: z.string().optional().nullable(),
  regions: z.array(z.string()).default([]),
  themes: z.array(z.string()).default([]),
  heroImageUrl: z.string().url().optional().nullable(),
  mapImageUrl: z.string().url().optional().nullable(),
  status: cruiseStatusSchema.default("draft"),
  externalRefs: externalRefsSchema,
})

export const insertCruiseSchema = cruiseCoreSchema
export const updateCruiseSchema = cruiseCoreSchema.partial()

export const cruiseListQuerySchema = z.object({
  cruiseType: cruiseTypeSchema.optional(),
  status: cruiseStatusSchema.optional(),
  lineSupplierId: z.string().optional(),
  region: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertCruise = z.infer<typeof insertCruiseSchema>
export type UpdateCruise = z.infer<typeof updateCruiseSchema>
export type CruiseListQuery = z.infer<typeof cruiseListQuerySchema>

const sailingCoreSchema = z.object({
  cruiseId: z.string(),
  shipId: z.string(),
  departureDate: isoDateSchema,
  returnDate: isoDateSchema,
  embarkPortFacilityId: z.string().optional().nullable(),
  disembarkPortFacilityId: z.string().optional().nullable(),
  direction: z.string().optional().nullable(),
  availabilityNote: z.string().optional().nullable(),
  isCharter: z.boolean().default(false),
  salesStatus: sailingSalesStatusSchema.default("open"),
  externalRefs: externalRefsSchema,
})

export const insertSailingSchema = sailingCoreSchema
export const updateSailingSchema = sailingCoreSchema.partial()

export const sailingListQuerySchema = z.object({
  cruiseId: z.string().optional(),
  shipId: z.string().optional(),
  dateFrom: isoDateSchema.optional(),
  dateTo: isoDateSchema.optional(),
  salesStatus: sailingSalesStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertSailing = z.infer<typeof insertSailingSchema>
export type UpdateSailing = z.infer<typeof updateSailingSchema>
export type SailingListQuery = z.infer<typeof sailingListQuerySchema>
