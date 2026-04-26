import {
  externalRefsSchema,
  moneyStringSchema,
  suiteAvailabilitySchema,
  suiteCategorySchema,
  z,
} from "./validation-shared.js"

const suiteCoreSchema = z.object({
  voyageId: z.string(),
  suiteCode: z.string().min(1).max(100),
  suiteName: z.string().min(1).max(255),
  suiteCategory: suiteCategorySchema.optional().nullable(),
  description: z.string().optional().nullable(),
  squareFeet: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  floorplanImages: z.array(z.string()).default([]),
  maxGuests: z.number().int().min(1).max(20).optional().nullable(),

  priceUSD: moneyStringSchema.optional().nullable(),
  priceEUR: moneyStringSchema.optional().nullable(),
  priceGBP: moneyStringSchema.optional().nullable(),
  priceAUD: moneyStringSchema.optional().nullable(),

  portFeeUSD: moneyStringSchema.optional().nullable(),
  portFeeEUR: moneyStringSchema.optional().nullable(),
  portFeeGBP: moneyStringSchema.optional().nullable(),
  portFeeAUD: moneyStringSchema.optional().nullable(),

  availability: suiteAvailabilitySchema.default("available"),
  unitsAvailable: z.number().int().nonnegative().optional().nullable(),
  appointmentOnly: z.boolean().default(false),
  notes: z.string().optional().nullable(),

  extra: z.record(z.string(), z.unknown()).default({}),
  externalRefs: externalRefsSchema,
})

export const insertSuiteSchema = suiteCoreSchema
export const updateSuiteSchema = suiteCoreSchema.partial()

export const replaceVoyageSuitesSchema = z.object({
  voyageId: z.string(),
  suites: z.array(suiteCoreSchema.omit({ voyageId: true })),
})

export type InsertSuite = z.infer<typeof insertSuiteSchema>
export type UpdateSuite = z.infer<typeof updateSuiteSchema>
export type ReplaceVoyageSuites = z.infer<typeof replaceVoyageSuitesSchema>
