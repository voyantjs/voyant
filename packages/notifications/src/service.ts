import { bookingParticipants, bookings } from "@voyantjs/bookings/schema"
import { bookingPaymentSchedules, invoices, paymentSessions } from "@voyantjs/finance"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import {
  notificationDeliveries,
  notificationReminderRules,
  notificationReminderRuns,
  notificationTemplates,
} from "./schema.js"
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
} from "./types.js"
import type {
  insertNotificationReminderRuleSchema,
  insertNotificationTemplateSchema,
  notificationDeliveryListQuerySchema,
  notificationReminderRuleListQuerySchema,
  notificationReminderRunListQuerySchema,
  notificationTemplateListQuerySchema,
  runDueRemindersSchema,
  sendInvoiceNotificationSchema,
  sendPaymentSessionNotificationSchema,
  sendNotificationSchema,
  updateNotificationReminderRuleSchema,
  updateNotificationTemplateSchema,
} from "./validation.js"

type NotificationTemplateListQuery = z.infer<typeof notificationTemplateListQuerySchema>
type NotificationDeliveryListQuery = z.infer<typeof notificationDeliveryListQuerySchema>
type CreateNotificationTemplateInput = z.infer<typeof insertNotificationTemplateSchema>
type UpdateNotificationTemplateInput = z.infer<typeof updateNotificationTemplateSchema>
type SendNotificationInput = z.infer<typeof sendNotificationSchema>
type NotificationReminderRuleListQuery = z.infer<typeof notificationReminderRuleListQuerySchema>
type NotificationReminderRunListQuery = z.infer<typeof notificationReminderRunListQuerySchema>
type CreateNotificationReminderRuleInput = z.infer<typeof insertNotificationReminderRuleSchema>
type UpdateNotificationReminderRuleInput = z.infer<typeof updateNotificationReminderRuleSchema>
type RunDueRemindersInput = z.infer<typeof runDueRemindersSchema>
type SendPaymentSessionNotificationInput = z.infer<typeof sendPaymentSessionNotificationSchema>
type SendInvoiceNotificationInput = z.infer<typeof sendInvoiceNotificationSchema>

type ReminderSweepResult = {
  processed: number
  sent: number
  skipped: number
  failed: number
}

/**
 * Thrown when `send()` is called with a channel that has no registered
 * provider, or with a provider name that does not exist.
 */
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

function toTimestamp(value?: string | null) {
  return value ? new Date(value) : null
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function addUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000)
}

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10)
}

function buildReminderDedupeKey(ruleId: string, targetId: string, runDate: string) {
  return `${ruleId}:${targetId}:${runDate}`
}

function resolveReminderRecipient(
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

async function listBookingNotificationParticipants(db: PostgresJsDatabase, bookingId: string) {
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

async function paginate<T>(
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

async function sendBookingPaymentScheduleReminder(
  db: PostgresJsDatabase,
  dispatcher: NotificationService,
  rule: typeof notificationReminderRules.$inferSelect,
  schedule: typeof bookingPaymentSchedules.$inferSelect,
  now: Date,
) {
  const runDate = toDateString(startOfUtcDay(now))
  const dedupeKey = buildReminderDedupeKey(rule.id, schedule.id, runDate)

  const [existingRun] = await db
    .select({ id: notificationReminderRuns.id })
    .from(notificationReminderRuns)
    .where(eq(notificationReminderRuns.dedupeKey, dedupeKey))
    .limit(1)

  if (existingRun) {
    return null
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, schedule.bookingId))
    .limit(1)

  if (!booking) {
    const [run] = await db
      .insert(notificationReminderRuns)
      .values({
        reminderRuleId: rule.id,
        targetType: "booking_payment_schedule",
        targetId: schedule.id,
        dedupeKey,
        bookingId: schedule.bookingId,
        personId: null,
        organizationId: null,
        paymentSessionId: null,
        notificationDeliveryId: null,
        status: "skipped",
        recipient: null,
        scheduledFor: now,
        processedAt: now,
        errorMessage: "Booking not found for payment schedule",
        metadata: {
          dueDate: schedule.dueDate,
          relativeDaysFromDueDate: rule.relativeDaysFromDueDate,
        },
      })
      .returning()

    return run ?? null
  }

  const participants = await db
    .select({
      id: bookingParticipants.id,
      firstName: bookingParticipants.firstName,
      lastName: bookingParticipants.lastName,
      email: bookingParticipants.email,
      participantType: bookingParticipants.participantType,
      isPrimary: bookingParticipants.isPrimary,
    })
    .from(bookingParticipants)
    .where(eq(bookingParticipants.bookingId, booking.id))
    .orderBy(desc(bookingParticipants.isPrimary), bookingParticipants.createdAt)

  const recipient = resolveReminderRecipient(participants)

  const [processingRun] = await db
    .insert(notificationReminderRuns)
    .values({
      reminderRuleId: rule.id,
      targetType: "booking_payment_schedule",
      targetId: schedule.id,
      dedupeKey,
      bookingId: booking.id,
      personId: booking.personId ?? null,
      organizationId: booking.organizationId ?? null,
      paymentSessionId: null,
      notificationDeliveryId: null,
      status: "processing",
      recipient: recipient?.email ?? null,
      scheduledFor: now,
      processedAt: now,
      errorMessage: null,
      metadata: {
        dueDate: schedule.dueDate,
        relativeDaysFromDueDate: rule.relativeDaysFromDueDate,
        bookingNumber: booking.bookingNumber,
      },
    })
    .onConflictDoNothing({ target: notificationReminderRuns.dedupeKey })
    .returning()

  if (!processingRun) {
    return null
  }

  if (!recipient?.email) {
    const [run] = await db
      .update(notificationReminderRuns)
      .set({
        status: "skipped",
        errorMessage: "No participant email available for booking payment reminder",
        processedAt: now,
        updatedAt: now,
      })
      .where(eq(notificationReminderRuns.id, processingRun.id))
      .returning()

    return run ?? null
  }

  try {
    const delivery = await notificationsService.sendNotification(db, dispatcher, {
      templateId: rule.templateId ?? null,
      templateSlug: rule.templateSlug ?? null,
      channel: rule.channel,
      provider: rule.provider ?? null,
      to: recipient.email,
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        dueDate: schedule.dueDate,
        amountCents: schedule.amountCents,
        currency: schedule.currency,
        scheduleType: schedule.scheduleType,
        reminderOffsetDays: rule.relativeDaysFromDueDate,
        participant: {
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          email: recipient.email,
        },
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          startDate: booking.startDate,
          endDate: booking.endDate,
          sellCurrency: booking.sellCurrency,
          sellAmountCents: booking.sellAmountCents,
        },
        paymentSchedule: {
          id: schedule.id,
          dueDate: schedule.dueDate,
          amountCents: schedule.amountCents,
          currency: schedule.currency,
          scheduleType: schedule.scheduleType,
          status: schedule.status,
        },
      },
      targetType: "booking_payment_schedule",
      targetId: schedule.id,
      bookingId: booking.id,
      personId: booking.personId ?? null,
      organizationId: booking.organizationId ?? null,
      metadata: {
        reminderRuleId: rule.id,
        reminderRunId: processingRun.id,
      },
      scheduledFor: now.toISOString(),
    })

    const [run] = await db
      .update(notificationReminderRuns)
      .set({
        notificationDeliveryId: delivery?.id ?? null,
        status: "sent",
        processedAt: new Date(),
        updatedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(notificationReminderRuns.id, processingRun.id))
      .returning()

    return run ?? null
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification reminder failed"
    const [run] = await db
      .update(notificationReminderRuns)
      .set({
        status: "failed",
        errorMessage: message,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationReminderRuns.id, processingRun.id))
      .returning()

    return run ?? null
  }
}

export const notificationsService = {
  async listTemplates(db: PostgresJsDatabase, query: NotificationTemplateListQuery) {
    const conditions = []
    if (query.channel) conditions.push(eq(notificationTemplates.channel, query.channel))
    if (query.provider) conditions.push(eq(notificationTemplates.provider, query.provider))
    if (query.status) conditions.push(eq(notificationTemplates.status, query.status))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(or(ilike(notificationTemplates.slug, term), ilike(notificationTemplates.name, term)))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(notificationTemplates)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(notificationTemplates.updatedAt)),
      db.select({ total: sql<number>`count(*)::int` }).from(notificationTemplates).where(where),
      query.limit,
      query.offset,
    )
  },

  async getTemplateById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, id))
      .limit(1)
    return row ?? null
  },

  async getTemplateBySlug(db: PostgresJsDatabase, slug: string) {
    const [row] = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.slug, slug))
      .limit(1)
    return row ?? null
  },

  async createTemplate(db: PostgresJsDatabase, data: CreateNotificationTemplateInput) {
    const [row] = await db.insert(notificationTemplates).values(data).returning()
    return row ?? null
  },

  async updateTemplate(db: PostgresJsDatabase, id: string, data: UpdateNotificationTemplateInput) {
    const [row] = await db
      .update(notificationTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notificationTemplates.id, id))
      .returning()
    return row ?? null
  },

  async listDeliveries(db: PostgresJsDatabase, query: NotificationDeliveryListQuery) {
    const conditions = []
    if (query.channel) conditions.push(eq(notificationDeliveries.channel, query.channel))
    if (query.provider) conditions.push(eq(notificationDeliveries.provider, query.provider))
    if (query.status) conditions.push(eq(notificationDeliveries.status, query.status))
    if (query.templateSlug) conditions.push(eq(notificationDeliveries.templateSlug, query.templateSlug))
    if (query.targetType) conditions.push(eq(notificationDeliveries.targetType, query.targetType))
    if (query.targetId) conditions.push(eq(notificationDeliveries.targetId, query.targetId))
    if (query.bookingId) conditions.push(eq(notificationDeliveries.bookingId, query.bookingId))
    if (query.invoiceId) conditions.push(eq(notificationDeliveries.invoiceId, query.invoiceId))
    if (query.paymentSessionId)
      conditions.push(eq(notificationDeliveries.paymentSessionId, query.paymentSessionId))
    if (query.personId) conditions.push(eq(notificationDeliveries.personId, query.personId))
    if (query.organizationId)
      conditions.push(eq(notificationDeliveries.organizationId, query.organizationId))

    const where = conditions.length > 0 ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(notificationDeliveries)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(notificationDeliveries.createdAt)),
      db.select({ total: sql<number>`count(*)::int` }).from(notificationDeliveries).where(where),
      query.limit,
      query.offset,
    )
  },

  async getDeliveryById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.id, id))
      .limit(1)
    return row ?? null
  },

  async sendNotification(
    db: PostgresJsDatabase,
    dispatcher: NotificationService,
    input: SendNotificationInput,
  ) {
    let template = null
    if (input.templateId) {
      template = await this.getTemplateById(db, input.templateId)
    } else if (input.templateSlug) {
      template = await this.getTemplateBySlug(db, input.templateSlug)
    }

    if ((input.templateId || input.templateSlug) && !template) {
      throw new NotificationError("Notification template not found")
    }

    const data = input.data ?? {}
    const channel = input.channel ?? template?.channel
    if (!channel) {
      throw new NotificationError("Notification channel is required")
    }

    const provider = input.provider ?? template?.provider ?? dispatcher.getProvider(channel)?.name
    if (!provider) {
      throw new NotificationError(`No notification provider available for channel "${channel}"`)
    }

    const subject = input.subject ?? renderNotificationTemplate(template?.subjectTemplate, data)
    const html = input.html ?? renderNotificationTemplate(template?.htmlTemplate, data)
    const text = input.text ?? renderNotificationTemplate(template?.textTemplate, data)

    const [pending] = await db
      .insert(notificationDeliveries)
      .values({
        templateId: template?.id ?? null,
        templateSlug: template?.slug ?? input.templateSlug ?? null,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        personId: input.personId ?? null,
        organizationId: input.organizationId ?? null,
        bookingId: input.bookingId ?? null,
        invoiceId: input.invoiceId ?? null,
        paymentSessionId: input.paymentSessionId ?? null,
        channel,
        provider,
        providerMessageId: null,
        status: "pending",
        toAddress: input.to,
        fromAddress: input.from ?? template?.fromAddress ?? null,
        subject: subject ?? null,
        htmlBody: html ?? null,
        textBody: text ?? null,
        payloadData: data,
        metadata: input.metadata ?? null,
        errorMessage: null,
        scheduledFor: toTimestamp(input.scheduledFor),
        sentAt: null,
        failedAt: null,
      })
      .returning()

    if (!pending) {
      throw new NotificationError("Failed to create notification delivery")
    }

    try {
      const result =
        provider === dispatcher.getProvider(channel)?.name
          ? await dispatcher.send({
              to: input.to,
              channel,
              provider,
              template: template?.slug ?? input.templateSlug ?? "direct",
              data,
              from: input.from ?? template?.fromAddress ?? undefined,
              subject: subject ?? undefined,
              html: html ?? undefined,
              text: text ?? undefined,
            })
          : await dispatcher.sendWith(provider, {
              to: input.to,
              channel,
              provider,
              template: template?.slug ?? input.templateSlug ?? "direct",
              data,
              from: input.from ?? template?.fromAddress ?? undefined,
              subject: subject ?? undefined,
              html: html ?? undefined,
              text: text ?? undefined,
            })

      const [sent] = await db
        .update(notificationDeliveries)
        .set({
          status: "sent",
          providerMessageId: result.id ?? null,
          sentAt: new Date(),
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(notificationDeliveries.id, pending.id))
        .returning()

      return sent ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message : "Notification send failed"
      const [failed] = await db
        .update(notificationDeliveries)
        .set({
          status: "failed",
          failedAt: new Date(),
          errorMessage: message,
          updatedAt: new Date(),
        })
        .where(eq(notificationDeliveries.id, pending.id))
        .returning()
      throw new NotificationError(failed?.errorMessage ?? message)
    }
  },

  async listReminderRules(db: PostgresJsDatabase, query: NotificationReminderRuleListQuery) {
    const conditions = []
    if (query.status) conditions.push(eq(notificationReminderRules.status, query.status))
    if (query.targetType) conditions.push(eq(notificationReminderRules.targetType, query.targetType))
    if (query.channel) conditions.push(eq(notificationReminderRules.channel, query.channel))
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(
        or(
          ilike(notificationReminderRules.slug, term),
          ilike(notificationReminderRules.name, term),
        ),
      )
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(notificationReminderRules)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(notificationReminderRules.updatedAt)),
      db.select({ total: sql<number>`count(*)::int` }).from(notificationReminderRules).where(where),
      query.limit,
      query.offset,
    )
  },

  async getReminderRuleById(db: PostgresJsDatabase, id: string) {
    const [row] = await db
      .select()
      .from(notificationReminderRules)
      .where(eq(notificationReminderRules.id, id))
      .limit(1)
    return row ?? null
  },

  async createReminderRule(db: PostgresJsDatabase, data: CreateNotificationReminderRuleInput) {
    const [row] = await db.insert(notificationReminderRules).values(data).returning()
    return row ?? null
  },

  async updateReminderRule(
    db: PostgresJsDatabase,
    id: string,
    data: UpdateNotificationReminderRuleInput,
  ) {
    const [row] = await db
      .update(notificationReminderRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notificationReminderRules.id, id))
      .returning()
    return row ?? null
  },

  async listReminderRuns(db: PostgresJsDatabase, query: NotificationReminderRunListQuery) {
    const conditions = []
    if (query.reminderRuleId) {
      conditions.push(eq(notificationReminderRuns.reminderRuleId, query.reminderRuleId))
    }
    if (query.targetType) conditions.push(eq(notificationReminderRuns.targetType, query.targetType))
    if (query.targetId) conditions.push(eq(notificationReminderRuns.targetId, query.targetId))
    if (query.bookingId) conditions.push(eq(notificationReminderRuns.bookingId, query.bookingId))
    if (query.status) conditions.push(eq(notificationReminderRuns.status, query.status))
    const where = conditions.length > 0 ? and(...conditions) : undefined
    return paginate(
      db
        .select()
        .from(notificationReminderRuns)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(notificationReminderRuns.createdAt)),
      db.select({ total: sql<number>`count(*)::int` }).from(notificationReminderRuns).where(where),
      query.limit,
      query.offset,
    )
  },

  async runDueReminders(
    db: PostgresJsDatabase,
    dispatcher: NotificationService,
    input: RunDueRemindersInput = {},
  ) {
    const now = toTimestamp(input.now) ?? new Date()
    const today = startOfUtcDay(now)
    const activeRules = await db
      .select()
      .from(notificationReminderRules)
      .where(eq(notificationReminderRules.status, "active"))
      .orderBy(notificationReminderRules.createdAt)

    const summary: ReminderSweepResult = {
      processed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    }

    for (const rule of activeRules) {
      const matchingDueDate = toDateString(addUtcDays(today, -rule.relativeDaysFromDueDate))
      const schedules = await db
        .select()
        .from(bookingPaymentSchedules)
        .where(
          and(
            eq(bookingPaymentSchedules.dueDate, matchingDueDate),
            or(
              eq(bookingPaymentSchedules.status, "pending"),
              eq(bookingPaymentSchedules.status, "due"),
            ),
          ),
        )
        .orderBy(bookingPaymentSchedules.createdAt)

      for (const schedule of schedules) {
        const run = await sendBookingPaymentScheduleReminder(db, dispatcher, rule, schedule, now)
        if (!run) {
          continue
        }

        summary.processed += 1
        if (run.status === "sent") summary.sent += 1
        if (run.status === "skipped") summary.skipped += 1
        if (run.status === "failed") summary.failed += 1
      }
    }

    return summary
  },

  async sendPaymentSessionNotification(
    db: PostgresJsDatabase,
    dispatcher: NotificationService,
    sessionId: string,
    input: SendPaymentSessionNotificationInput,
  ) {
    const [session] = await db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.id, sessionId))
      .limit(1)

    if (!session) {
      return null
    }

    const booking = session.bookingId
      ? ((await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, session.bookingId))
          .limit(1))[0] ?? null)
      : null

    const invoice = session.invoiceId
      ? ((await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, session.invoiceId))
          .limit(1))[0] ?? null)
      : null

    const participants = booking ? await listBookingNotificationParticipants(db, booking.id) : []
    const recipient = resolveReminderRecipient(participants)
    const to = input.to ?? session.payerEmail ?? recipient?.email ?? null

    if (!to) {
      throw new NotificationError("No recipient available for payment session notification")
    }

    return this.sendNotification(db, dispatcher, {
      templateId: input.templateId ?? null,
      templateSlug: input.templateSlug ?? null,
      channel: input.channel,
      provider: input.provider ?? null,
      to,
      from: input.from ?? null,
      subject: input.subject ?? null,
      html: input.html ?? null,
      text: input.text ?? null,
      data: {
        paymentSession: {
          id: session.id,
          status: session.status,
          provider: session.provider,
          currency: session.currency,
          amountCents: session.amountCents,
          redirectUrl: session.redirectUrl,
          returnUrl: session.returnUrl,
          cancelUrl: session.cancelUrl,
          expiresAt: session.expiresAt,
          paymentMethod: session.paymentMethod,
          externalReference: session.externalReference,
        },
        booking: booking
          ? {
              id: booking.id,
              bookingNumber: booking.bookingNumber,
              startDate: booking.startDate,
              endDate: booking.endDate,
              sellCurrency: booking.sellCurrency,
              sellAmountCents: booking.sellAmountCents,
            }
          : null,
        invoice: invoice
          ? {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              invoiceType: invoice.invoiceType,
              status: invoice.status,
              currency: invoice.currency,
              totalCents: invoice.totalCents,
              balanceDueCents: invoice.balanceDueCents,
              issueDate: invoice.issueDate,
              dueDate: invoice.dueDate,
            }
          : null,
        participant: recipient
          ? {
              firstName: recipient.firstName,
              lastName: recipient.lastName,
              email: recipient.email,
            }
          : null,
        ...(input.data ?? {}),
      },
      targetType: "payment_session",
      targetId: session.id,
      bookingId: session.bookingId ?? null,
      invoiceId: session.invoiceId ?? null,
      paymentSessionId: session.id,
      personId: session.payerPersonId ?? booking?.personId ?? null,
      organizationId: session.payerOrganizationId ?? booking?.organizationId ?? null,
      metadata: input.metadata ?? null,
      scheduledFor: input.scheduledFor ?? null,
    })
  },

  async sendInvoiceNotification(
    db: PostgresJsDatabase,
    dispatcher: NotificationService,
    invoiceId: string,
    input: SendInvoiceNotificationInput,
  ) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1)

    if (!invoice) {
      return null
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, invoice.bookingId))
      .limit(1)

    const participants = booking ? await listBookingNotificationParticipants(db, booking.id) : []
    const recipient = resolveReminderRecipient(participants)

    const [latestSession] = await db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.invoiceId, invoice.id))
      .orderBy(desc(paymentSessions.createdAt))
      .limit(1)

    const to = input.to ?? latestSession?.payerEmail ?? recipient?.email ?? null

    if (!to) {
      throw new NotificationError("No recipient available for invoice notification")
    }

    return this.sendNotification(db, dispatcher, {
      templateId: input.templateId ?? null,
      templateSlug: input.templateSlug ?? null,
      channel: input.channel,
      provider: input.provider ?? null,
      to,
      from: input.from ?? null,
      subject: input.subject ?? null,
      html: input.html ?? null,
      text: input.text ?? null,
      data: {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.invoiceType,
          status: invoice.status,
          currency: invoice.currency,
          subtotalCents: invoice.subtotalCents,
          taxCents: invoice.taxCents,
          totalCents: invoice.totalCents,
          paidCents: invoice.paidCents,
          balanceDueCents: invoice.balanceDueCents,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
        },
        booking: booking
          ? {
              id: booking.id,
              bookingNumber: booking.bookingNumber,
              startDate: booking.startDate,
              endDate: booking.endDate,
              sellCurrency: booking.sellCurrency,
              sellAmountCents: booking.sellAmountCents,
            }
          : null,
        paymentSession: latestSession
          ? {
              id: latestSession.id,
              status: latestSession.status,
              provider: latestSession.provider,
              redirectUrl: latestSession.redirectUrl,
              expiresAt: latestSession.expiresAt,
              amountCents: latestSession.amountCents,
              currency: latestSession.currency,
            }
          : null,
        participant: recipient
          ? {
              firstName: recipient.firstName,
              lastName: recipient.lastName,
              email: recipient.email,
            }
          : null,
        ...(input.data ?? {}),
      },
      targetType: "invoice",
      targetId: invoice.id,
      bookingId: invoice.bookingId,
      invoiceId: invoice.id,
      paymentSessionId: latestSession?.id ?? null,
      personId: invoice.personId ?? booking?.personId ?? null,
      organizationId: invoice.organizationId ?? booking?.organizationId ?? null,
      metadata: input.metadata ?? null,
      scheduledFor: input.scheduledFor ?? null,
    })
  },
}
