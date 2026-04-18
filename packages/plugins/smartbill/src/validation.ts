import { z } from "zod"
import type {
  SmartbillLogger,
  SmartbillMapFn,
  SmartbillPluginOptions,
  SmartbillSyncEventNames,
} from "./plugin.js"
import type { SmartbillFetch } from "./types.js"

const optionalString = z.string().trim().min(1).optional()
const optionalUrl = z.string().trim().url().optional()

const optionalFetch = z.custom<SmartbillFetch | undefined>(
  (value) => value === undefined || typeof value === "function",
  "Expected a fetch implementation function",
)

const optionalLogger = z.custom<SmartbillLogger | undefined>(
  (value) =>
    value === undefined ||
    (typeof value === "object" &&
      value !== null &&
      typeof (value as SmartbillLogger).error === "function" &&
      (((value as SmartbillLogger).info ?? undefined) === undefined ||
        typeof (value as SmartbillLogger).info === "function")),
  "Expected a logger with an error function",
)

const optionalMapEvent = z.custom<SmartbillMapFn | undefined>(
  (value) => value === undefined || typeof value === "function",
  "Expected a mapEvent function",
)

const optionalEvents = z.custom<SmartbillSyncEventNames | undefined>((value) => {
  if (value === undefined) return true
  if (typeof value !== "object" || value === null) return false
  const events = value as SmartbillSyncEventNames
  return [events.issued, events.voided, events.syncRequested].every(
    (entry) => entry === undefined || (typeof entry === "string" && entry.trim().length > 0),
  )
}, "Expected event names to be non-empty strings")

export const smartbillPluginOptionsSchema = z.object({
  username: z.string().trim().min(1),
  apiToken: z.string().trim().min(1),
  companyVatCode: z.string().trim().min(1),
  seriesName: z.string().trim().min(1),
  apiUrl: optionalUrl,
  fetch: optionalFetch.optional(),
  language: optionalString,
  isTaxIncluded: z.boolean().optional(),
  art311SpecialRegime: z.boolean().optional(),
  events: optionalEvents.optional(),
  mapEvent: optionalMapEvent.optional(),
  logger: optionalLogger.optional(),
}) satisfies z.ZodType<SmartbillPluginOptions>
