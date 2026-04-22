import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { createLocalProvider } from "../../src/providers/local.js"
import { createNotificationService } from "../../src/service.js"
import { deliverReminderRun, queueDueReminders } from "../../src/service-reminders.js"
import { createNotificationsTestContext, DB_AVAILABLE, json } from "./test-helpers"

describe.skipIf(!DB_AVAILABLE)("Notification reminder tasks", () => {
  const ctx = createNotificationsTestContext()

  it("queues due reminder runs before sending them durably", async () => {
    const createTemplateRes = await ctx.request("/templates", {
      method: "POST",
      ...json({
        slug: "queued-payment-reminder",
        name: "Queued Payment Reminder",
        channel: "email",
        provider: "local",
        status: "active",
        subjectTemplate: "Payment due for {{ booking.bookingNumber }}",
        textTemplate: "Due {{ paymentSchedule.dueDate }} amount {{ paymentSchedule.amountCents }}",
      }),
    })
    const { data: template } = await createTemplateRes.json()

    await ctx.db.execute(sql`
      INSERT INTO bookings (id, booking_number, person_id, sell_currency, sell_amount_cents)
      VALUES ('book_queue', 'BK-QUEUE-1', 'person_queue', 'EUR', 45000)
    `)
    await ctx.db.execute(sql`
      INSERT INTO booking_travelers (id, booking_id, first_name, last_name, email, participant_type, is_primary)
      VALUES ('bkpt_queue', 'book_queue', 'Mia', 'Traveler', 'mia@example.com', 'traveler', true)
    `)
    await ctx.db.execute(sql`
      INSERT INTO booking_payment_schedules (
        id,
        booking_id,
        schedule_type,
        status,
        due_date,
        currency,
        amount_cents
      )
      VALUES (
        'bkpy_queue',
        'book_queue',
        'balance',
        'pending',
        DATE '2026-04-10',
        'EUR',
        25000
      )
    `)

    const createRuleRes = await ctx.request("/reminder-rules", {
      method: "POST",
      ...json({
        slug: "queued-balance-due-2-days-before",
        name: "Queued Balance Due 2 Days Before",
        status: "active",
        targetType: "booking_payment_schedule",
        channel: "email",
        provider: "local",
        templateId: template.id,
        relativeDaysFromDueDate: -2,
      }),
    })
    expect(createRuleRes.status).toBe(201)

    const enqueuedReminderRuns: string[] = []
    const queueResult = await queueDueReminders(
      ctx.db,
      { now: "2026-04-08T09:00:00.000Z" },
      async ({ reminderRunId }) => {
        enqueuedReminderRuns.push(reminderRunId)
      },
    )

    expect(queueResult).toEqual({
      processed: 1,
      queued: 1,
      skipped: 0,
      failed: 0,
    })
    expect(ctx.sink).not.toHaveBeenCalled()
    expect(enqueuedReminderRuns).toHaveLength(1)

    const queuedRunsRes = await ctx.request("/reminder-runs?bookingId=book_queue")
    expect(queuedRunsRes.status).toBe(200)
    const queuedRunsBody = await queuedRunsRes.json()
    expect(queuedRunsBody.total).toBe(1)
    expect(queuedRunsBody.data[0].status).toBe("queued")
    expect(queuedRunsBody.data[0].delivery).toBeNull()

    const dispatcher = createNotificationService([
      createLocalProvider({
        sink: ctx.sink,
      }),
    ])

    const deliveredRun = await deliverReminderRun(ctx.db, dispatcher, {
      reminderRunId: enqueuedReminderRuns[0]!,
    })

    expect(deliveredRun?.status).toBe("sent")
    expect(ctx.sink).toHaveBeenCalledOnce()

    const deliveredRunsRes = await ctx.request("/reminder-runs?bookingId=book_queue")
    expect(deliveredRunsRes.status).toBe(200)
    const deliveredRunsBody = await deliveredRunsRes.json()
    expect(deliveredRunsBody.data[0].status).toBe("sent")
    expect(deliveredRunsBody.data[0].delivery.status).toBe("sent")
  })
})
