import { bookingParticipants, bookings } from "@voyantjs/bookings/schema"
import { bookingPaymentSchedules } from "@voyantjs/finance"
import { and, desc, eq, or } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { notificationReminderRules, notificationReminderRuns } from "./schema.js"
import { sendNotification } from "./service-deliveries.js"
import type {
  BookingPaymentScheduleRow,
  NotificationReminderRuleRow,
  NotificationService,
  ReminderSweepResult,
  RunDueRemindersInput,
} from "./service-shared.js"
import {
  addUtcDays,
  buildReminderDedupeKey,
  resolveReminderRecipient,
  startOfUtcDay,
  toDateString,
  toTimestamp,
} from "./service-shared.js"

async function sendBookingPaymentScheduleReminder(
  db: PostgresJsDatabase,
  dispatcher: NotificationService,
  rule: NotificationReminderRuleRow,
  schedule: BookingPaymentScheduleRow,
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
    const delivery = await sendNotification(db, dispatcher, {
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

export async function runDueReminders(
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
}
