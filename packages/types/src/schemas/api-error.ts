import { z } from "zod"

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  requestId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>
