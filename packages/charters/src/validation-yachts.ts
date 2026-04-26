import { externalRefsSchema, slugSchema, yachtClassSchema, z } from "./validation-shared.js"

const crewBioSchema = z.object({
  role: z.string().min(1),
  name: z.string().min(1),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
})

const yachtCoreSchema = z.object({
  lineSupplierId: z.string().optional().nullable(),
  name: z.string().min(1).max(255),
  slug: slugSchema,
  yachtClass: yachtClassSchema,
  capacityGuests: z.number().int().nonnegative().optional().nullable(),
  capacityCrew: z.number().int().nonnegative().optional().nullable(),
  lengthMeters: z.string().optional().nullable(),
  yearBuilt: z.number().int().optional().nullable(),
  yearRefurbished: z.number().int().optional().nullable(),
  imo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  gallery: z.array(z.string()).default([]),
  amenities: z.record(z.string(), z.unknown()).default({}),
  crewBios: z.array(crewBioSchema).default([]),
  defaultCharterAreas: z.array(z.string()).default([]),
  externalRefs: externalRefsSchema,
  isActive: z.boolean().default(true),
})

export const insertYachtSchema = yachtCoreSchema
export const updateYachtSchema = yachtCoreSchema.partial()

export const yachtListQuerySchema = z.object({
  lineSupplierId: z.string().optional(),
  yachtClass: yachtClassSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type InsertYacht = z.infer<typeof insertYachtSchema>
export type UpdateYacht = z.infer<typeof updateYachtSchema>
export type YachtListQuery = z.infer<typeof yachtListQuerySchema>
