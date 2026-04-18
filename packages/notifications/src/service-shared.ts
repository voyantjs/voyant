import { bookingParticipants } from "@voyantjs/bookings/schema"
import type { bookingPaymentSchedules } from "@voyantjs/finance"
import { and, desc, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { SQLWrapper } from "drizzle-orm/sql"
import type { z } from "zod"

import type { notificationReminderRules } from "./schema.js"
import type {
  NotificationAttachment,
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
} from "./types.js"
import type {
  bookingDocumentBundleItemSchema,
  insertNotificationReminderRuleSchema,
  insertNotificationTemplateSchema,
  notificationDeliveryListQuerySchema,
  notificationReminderRuleListQuerySchema,
  notificationReminderRunListQuerySchema,
  notificationReminderRunRecordSchema,
  notificationTemplateListQuerySchema,
  runDueRemindersSchema,
  sendBookingDocumentsNotificationSchema,
  sendInvoiceNotificationSchema,
  sendNotificationSchema,
  sendPaymentSessionNotificationSchema,
  updateNotificationReminderRuleSchema,
  updateNotificationTemplateSchema,
} from "./validation.js"

export type NotificationTemplateListQuery = z.infer<typeof notificationTemplateListQuerySchema>
export type NotificationDeliveryListQuery = z.infer<typeof notificationDeliveryListQuerySchema>
export type CreateNotificationTemplateInput = z.infer<typeof insertNotificationTemplateSchema>
export type UpdateNotificationTemplateInput = z.infer<typeof updateNotificationTemplateSchema>
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>
export type NotificationReminderRuleListQuery = z.infer<
  typeof notificationReminderRuleListQuerySchema
>
export type NotificationReminderRunListQuery = z.infer<
  typeof notificationReminderRunListQuerySchema
>
export type NotificationReminderRunRecord = z.infer<typeof notificationReminderRunRecordSchema>
export type CreateNotificationReminderRuleInput = z.infer<
  typeof insertNotificationReminderRuleSchema
>
export type UpdateNotificationReminderRuleInput = z.infer<
  typeof updateNotificationReminderRuleSchema
>
export type RunDueRemindersInput = z.infer<typeof runDueRemindersSchema>
export type SendPaymentSessionNotificationInput = z.infer<
  typeof sendPaymentSessionNotificationSchema
>
export type SendInvoiceNotificationInput = z.infer<typeof sendInvoiceNotificationSchema>
export type SendBookingDocumentsNotificationInput = z.infer<
  typeof sendBookingDocumentsNotificationSchema
>
export type BookingDocumentBundleItem = z.infer<typeof bookingDocumentBundleItemSchema>

export type ReminderSweepResult = {
  processed: number
  sent: number
  skipped: number
  failed: number
}

export type ReminderQueueResult = {
  processed: number
  queued: number
  skipped: number
  failed: number
}

export type NotificationReminderRuleRow = typeof notificationReminderRules.$inferSelect
export type BookingPaymentScheduleRow = typeof bookingPaymentSchedules.$inferSelect

export class NotificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotificationError"
  }
}

export interface NotificationService {
  send(payload: NotificationPayload): Promise<NotificationResult>
  sendWith(providerName: string, payload: NotificationPayload): Promise<NotificationResult>
  getProvider(channel: NotificationChannel): NotificationProvider | undefined
}

export function createNotificationService(
  providers: ReadonlyArray<NotificationProvider>,
): NotificationService {
  const byChannel = new Map<NotificationChannel, NotificationProvider>()
  const byName = new Map<string, NotificationProvider>()
  for (const provider of providers) {
    byName.set(provider.name, provider)
    for (const channel of provider.channels) {
      byChannel.set(channel, provider)
    }
  }

  return {
    async send(payload) {
      const hintedProvider = payload.provider ? byName.get(payload.provider) : null
      const provider = hintedProvider ?? byChannel.get(payload.channel)
      if (!provider) {
        throw new NotificationError(
          `No notification provider registered for channel "${payload.channel}"`,
        )
      }
      return provider.send(payload)
    },
    async sendWith(providerName, payload) {
      const provider = byName.get(providerName)
      if (!provider) {
        throw new NotificationError(
          `No notification provider registered with name "${providerName}"`,
        )
      }
      return provider.send(payload)
    },
    getProvider(channel) {
      return byChannel.get(channel)
    },
  }
}

export function summarizeNotificationAttachments(
  attachments: ReadonlyArray<NotificationAttachment> | null | undefined,
) {
  if (!attachments || attachments.length === 0) {
    return []
  }

  return attachments.map((attachment) => ({
    filename: attachment.filename,
    path: attachment.path ?? null,
    contentType: attachment.contentType ?? null,
    disposition: attachment.disposition ?? null,
    contentId: attachment.contentId ?? null,
  }))
}

function resolveMustachePath(path: string, scope: Record<string, unknown>): unknown {
  const parts = path.match(/[^.[\]]+/g) ?? []
  let current: unknown = scope
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function stringifyRenderedValue(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

export function renderNotificationTemplate(
  template: string | null | undefined,
  data: Record<string, unknown>,
) {
  if (!template) return null
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, path: string) => {
    return stringifyRenderedValue(resolveMustachePath(path.trim(), data))
  })
}

export function toTimestamp(value?: string | null) {
  return value ? new Date(value) : null
}

export function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

export function addUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000)
}

export function toDateString(value: Date) {
  return value.toISOString().slice(0, 10)
}

export function buildReminderDedupeKey(ruleId: string, targetId: string, runDate: string) {
  return `${ruleId}:${targetId}:${runDate}`
}

export function resolveReminderRecipient(
  participants: Array<{
    email: string | null
    isPrimary: boolean
    participantType: string
    firstName: string
    lastName: string
  }>,
) {
  const withEmail = participants.filter((participant) => participant.email)
  if (withEmail.length === 0) {
    return null
  }

  const primary = withEmail.find((participant) => participant.isPrimary)
  if (primary) {
    return primary
  }

  const preferredTypes = ["booker", "contact", "traveler", "occupant"]
  for (const type of preferredTypes) {
    const match = withEmail.find((participant) => participant.participantType === type)
    if (match) {
      return match
    }
  }

  return withEmail[0] ?? null
}

export async function listBookingNotificationParticipants(
  db: PostgresJsDatabase,
  bookingId: string,
) {
  return db
    .select({
      id: bookingParticipants.id,
      firstName: bookingParticipants.firstName,
      lastName: bookingParticipants.lastName,
      email: bookingParticipants.email,
      participantType: bookingParticipants.participantType,
      isPrimary: bookingParticipants.isPrimary,
    })
    .from(bookingParticipants)
    .where(eq(bookingParticipants.bookingId, bookingId))
    .orderBy(desc(bookingParticipants.isPrimary), bookingParticipants.createdAt)
}

export async function paginate<T>(
  rowsPromise: Promise<T[]>,
  totalPromise: Promise<Array<{ total: number }>>,
  limit: number,
  offset: number,
) {
  const [data, totalRows] = await Promise.all([rowsPromise, totalPromise])
  return {
    data,
    total: totalRows[0]?.total ?? 0,
    limit,
    offset,
  }
}

export function buildWhereClause<T extends SQLWrapper>(conditions: Array<T | undefined>) {
  const filtered = conditions.filter((condition): condition is T => Boolean(condition))
  return filtered.length > 0 ? and(...filtered) : undefined
}
