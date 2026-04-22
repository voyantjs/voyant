import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { createNotificationsTestContext, DB_AVAILABLE, json } from "./test-helpers"

describe.skipIf(!DB_AVAILABLE)("Notification reminder routes", () => {
  const ctx = createNotificationsTestContext()

  it("creates and runs due payment reminder rules without duplicating runs", async () => {
    const createTemplateRes = await ctx.request("/templates", {
      method: "POST",
      ...json({
        slug: "payment-reminder",
        name: "Payment Reminder",
        channel: "email",
        provider: "local",
        status: "active",
        subjectTemplate: "Payment due for {{ bookingNumber }}",
        textTemplate: "Due {{ dueDate }} amount {{ amountCents }} {{ currency }}",
      }),
    })
    const { data: template } = await createTemplateRes.json()

    await ctx.db.execute(sql`
      INSERT INTO bookings (id, booking_number, person_id, sell_currency, sell_amount_cents)
      VALUES ('book_test', 'BK-REM-1', 'person_1', 'EUR', 45000)
    `)
    await ctx.db.execute(sql`
      INSERT INTO booking_travelers (id, booking_id, first_name, last_name, email, participant_type, is_primary)
      VALUES ('bkpt_test', 'book_test', 'Ana', 'Traveler', 'ana@example.com', 'traveler', true)
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
        'bkpy_test',
        'book_test',
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
        slug: "balance-due-2-days-before",
        name: "Balance Due 2 Days Before",
        status: "active",
        targetType: "booking_payment_schedule",
        channel: "email",
        provider: "local",
        templateId: template.id,
        relativeDaysFromDueDate: -2,
      }),
    })
    expect(createRuleRes.status).toBe(201)

    const runRes = await ctx.request("/reminders/run-due", {
      method: "POST",
      ...json({ now: "2026-04-08T09:00:00.000Z" }),
    })
    expect(runRes.status).toBe(200)
    const firstRunBody = await runRes.json()
    expect(firstRunBody.data.processed).toBe(1)
    expect(firstRunBody.data.sent).toBe(1)
    expect(ctx.sink).toHaveBeenCalledOnce()

    const runsRes = await ctx.request("/reminder-runs?bookingId=book_test")
    expect(runsRes.status).toBe(200)
    const runsBody = await runsRes.json()
    expect(runsBody.total).toBe(1)
    expect(runsBody.data[0].status).toBe("sent")
    expect(runsBody.data[0].links.bookingPaymentScheduleId).toBe("bkpy_test")
    expect(runsBody.data[0].reminderRule.slug).toBe("balance-due-2-days-before")
    expect(runsBody.data[0].delivery.status).toBe("sent")

    const runDetailRes = await ctx.request(`/reminder-runs/${runsBody.data[0].id}`)
    expect(runDetailRes.status).toBe(200)
    const runDetailBody = await runDetailRes.json()
    expect(runDetailBody.data.links.bookingId).toBe("book_test")
    expect(runDetailBody.data.links.bookingPaymentScheduleId).toBe("bkpy_test")
    expect(runDetailBody.data.reminderRule.relativeDaysFromDueDate).toBe(-2)
    expect(runDetailBody.data.delivery.toAddress).toBe("ana@example.com")

    const secondRunRes = await ctx.request("/reminders/run-due", {
      method: "POST",
      ...json({ now: "2026-04-08T10:00:00.000Z" }),
    })
    expect(secondRunRes.status).toBe(200)
    const secondRunBody = await secondRunRes.json()
    expect(secondRunBody.data.processed).toBe(0)

    const deliveriesRes = await ctx.request(
      "/deliveries?targetType=booking_payment_schedule&targetId=bkpy_test",
    )
    expect(deliveriesRes.status).toBe(200)
    const deliveriesBody = await deliveriesRes.json()
    expect(deliveriesBody.total).toBe(1)
  })

  it("creates and runs due invoice reminder rules for unpaid bank-transfer documents", async () => {
    const createTemplateRes = await ctx.request("/templates", {
      method: "POST",
      ...json({
        slug: "invoice-reminder",
        name: "Invoice Reminder",
        channel: "email",
        provider: "local",
        status: "active",
        subjectTemplate: "Invoice {{ invoice.invoiceNumber }} due for {{ booking.bookingNumber }}",
        textTemplate: "Due {{ invoice.dueDate }} balance {{ invoice.balanceDueCents }}",
      }),
    })
    const { data: template } = await createTemplateRes.json()

    await ctx.db.execute(sql`
      INSERT INTO bookings (id, booking_number, person_id, sell_currency, sell_amount_cents)
      VALUES ('book_inv', 'BK-INV-1', 'person_2', 'EUR', 90000)
    `)
    await ctx.db.execute(sql`
      INSERT INTO booking_travelers (id, booking_id, first_name, last_name, email, participant_type, is_primary)
      VALUES ('bkpt_inv', 'book_inv', 'Mara', 'Traveler', 'mara@example.com', 'traveler', true)
    `)
    await ctx.db.execute(sql`
      INSERT INTO invoices (
        id,
        invoice_number,
        invoice_type,
        booking_id,
        person_id,
        status,
        currency,
        subtotal_cents,
        tax_cents,
        total_cents,
        paid_cents,
        balance_due_cents,
        issue_date,
        due_date
      )
      VALUES (
        'inv_test',
        'PRO-2001',
        'proforma',
        'book_inv',
        'person_2',
        'sent',
        'EUR',
        90000,
        0,
        90000,
        0,
        90000,
        DATE '2026-04-01',
        DATE '2026-04-10'
      )
    `)

    const createRuleRes = await ctx.request("/reminder-rules", {
      method: "POST",
      ...json({
        slug: "invoice-due-2-days-before",
        name: "Invoice Due 2 Days Before",
        status: "active",
        targetType: "invoice",
        channel: "email",
        provider: "local",
        templateId: template.id,
        relativeDaysFromDueDate: -2,
      }),
    })
    expect(createRuleRes.status).toBe(201)

    const runRes = await ctx.request("/reminders/run-due", {
      method: "POST",
      ...json({ now: "2026-04-08T09:00:00.000Z" }),
    })
    expect(runRes.status).toBe(200)
    const runBody = await runRes.json()
    expect(runBody.data.processed).toBe(1)
    expect(runBody.data.sent).toBe(1)
    expect(ctx.sink).toHaveBeenCalledOnce()
    expect(ctx.sink.mock.calls[0]?.[0]).toMatchObject({
      to: "mara@example.com",
      channel: "email",
    })

    const runsRes = await ctx.request("/reminder-runs?bookingId=book_inv&targetType=invoice")
    expect(runsRes.status).toBe(200)
    const runsBody = await runsRes.json()
    expect(runsBody.total).toBe(1)
    expect(runsBody.data[0].targetType).toBe("invoice")
    expect(runsBody.data[0].links.invoiceId).toBe("inv_test")
    expect(runsBody.data[0].reminderRule.slug).toBe("invoice-due-2-days-before")

    const invoiceRunsRes = await ctx.request("/reminder-runs?invoiceId=inv_test")
    expect(invoiceRunsRes.status).toBe(200)
    const invoiceRunsBody = await invoiceRunsRes.json()
    expect(invoiceRunsBody.total).toBe(1)
    expect(invoiceRunsBody.data[0].links.invoiceId).toBe("inv_test")

    const deliveriesRes = await ctx.request("/deliveries?targetType=invoice&targetId=inv_test")
    expect(deliveriesRes.status).toBe(200)
    const deliveriesBody = await deliveriesRes.json()
    expect(deliveriesBody.total).toBe(1)
  })
})
