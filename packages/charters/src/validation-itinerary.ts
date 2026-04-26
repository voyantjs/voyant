import { isoDateSchema, z } from "./validation-shared.js"

const scheduleDayCoreSchema = z.object({
  voyageId: z.string(),
  dayNumber: z.number().int().min(1).max(365),
  portFacilityId: z.string().optional().nullable(),
  portName: z.string().optional().nullable(),
  scheduleDate: isoDateSchema.optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
  departureTime: z.string().optional().nullable(),
  isSeaDay: z.boolean().default(false),
  description: z.string().optional().nullable(),
  activities: z.array(z.string()).default([]),
})

export const insertScheduleDaySchema = scheduleDayCoreSchema
export const updateScheduleDaySchema = scheduleDayCoreSchema.partial()
export const replaceVoyageScheduleSchema = z.object({
  voyageId: z.string(),
  days: z.array(scheduleDayCoreSchema.omit({ voyageId: true })),
})

export type InsertScheduleDay = z.infer<typeof insertScheduleDaySchema>
export type UpdateScheduleDay = z.infer<typeof updateScheduleDaySchema>
export type ReplaceVoyageSchedule = z.infer<typeof replaceVoyageScheduleSchema>
