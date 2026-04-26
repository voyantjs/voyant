import { cruiseInclusionKindSchema, cruiseMediaTypeSchema, z } from "./validation-shared.js"

const cruiseMediaCoreSchema = z.object({
  cruiseId: z.string(),
  sailingId: z.string().optional().nullable(),
  mediaType: cruiseMediaTypeSchema,
  name: z.string().min(1).max(255),
  url: z.string().url(),
  storageKey: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
  altText: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isCover: z.boolean().default(false),
})

export const insertCruiseMediaSchema = cruiseMediaCoreSchema
export const updateCruiseMediaSchema = cruiseMediaCoreSchema.partial()

export type InsertCruiseMedia = z.infer<typeof insertCruiseMediaSchema>
export type UpdateCruiseMedia = z.infer<typeof updateCruiseMediaSchema>

const cruiseInclusionCoreSchema = z.object({
  cruiseId: z.string(),
  kind: cruiseInclusionKindSchema,
  label: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
})

export const insertCruiseInclusionSchema = cruiseInclusionCoreSchema
export const updateCruiseInclusionSchema = cruiseInclusionCoreSchema.partial()

export type InsertCruiseInclusion = z.infer<typeof insertCruiseInclusionSchema>
export type UpdateCruiseInclusion = z.infer<typeof updateCruiseInclusionSchema>
