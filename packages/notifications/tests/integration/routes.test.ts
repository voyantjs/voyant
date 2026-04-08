import { sql } from "drizzle-orm"
import { Hono } from "hono"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { createLocalProvider } from "../../src/providers/local.js"
import { createNotificationsRoutes } from "../../src/routes.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL
const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

async function cleanupNotificationsTestData(
  // biome-ignore lint/suspicious/noExplicitAny: test db typing
  db: any,
) {
  await db.execute(sql`
    TRUNCATE
      notification_reminder_runs,
      notification_reminder_rules,
      notification_deliveries,
      notification_templates,
      payment_sessions,
      invoices,
      booking_payment_schedules,
      booking_participants,
      bookings
    CASCADE
  `)
}

describe.skipIf(!DB_AVAILABLE)("Notifications routes", () => {
  let app: Hono
  let db: ReturnType<typeof import("@voyantjs/db/test-utils").createTestDb>
  const sink = vi.fn()

  beforeAll(async () => {
    const { createTestDb } = await import("@voyantjs/db/test-utils")
    db = createTestDb()

    await db.execute(sql`
      DO $$
      BEGIN
        CREATE TYPE notification_channel AS ENUM ('email', 'sms');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await db.execute(sql`
      DO $$
      BEGIN
        CREATE TYPE notification_template_status AS ENUM ('draft', 'active', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await db.execute(sql`
      DO $$
      BEGIN
        CREATE TYPE notification_delivery_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await db.execute(sql`
      DO $$
      BEGIN
        CREATE TYPE notification_target_type AS ENUM (
          'booking',
          'booking_payment_schedule',
          'booking_guarantee',
          'invoice',
          'payment_session',
          'person',
          'organization',
          'other'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await db.execute(sql`
      ALTER TYPE notification_target_type ADD VALUE IF NOT EXISTS 'booking_payment_schedule';
    `)
    await db.execute(sql`
      ALTER TYPE notification_target_type ADD VALUE IF NOT EXISTS 'booking_guarantee';
    `)
    await db.execute(sql`
      DO $$
      BEGIN
        CREATE TYPE notification_reminder_status AS ENUM ('draft', 'active', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await db.execute(sql`
      DO $$
      BEGIN
        CREATE TYPE notification_reminder_target_type AS ENUM ('booking_payment_schedule');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await db.execute(sql`
      DO $$
      BEGIN
        CREATE TYPE notification_reminder_run_status AS ENUM ('processing', 'sent', 'skipped', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id text PRIMARY KEY NOT NULL,
        booking_number text NOT NULL,
        person_id text,
        organization_id text,
        status text NOT NULL DEFAULT 'confirmed',
        sell_currency text NOT NULL DEFAULT 'EUR',
        sell_amount_cents integer,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS booking_participants (
        id text PRIMARY KEY NOT NULL,
        booking_id text NOT NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        email text,
        participant_type text NOT NULL DEFAULT 'traveler',
        is_primary boolean NOT NULL DEFAULT false,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS booking_payment_schedules (
        id text PRIMARY KEY NOT NULL,
        booking_id text NOT NULL,
        booking_item_id text,
        schedule_type text NOT NULL DEFAULT 'balance',
        status text NOT NULL DEFAULT 'pending',
        due_date date NOT NULL,
        currency text NOT NULL,
        amount_cents integer NOT NULL,
        notes text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id text PRIMARY KEY NOT NULL,
        invoice_number text NOT NULL,
        invoice_type text NOT NULL DEFAULT 'invoice',
        booking_id text NOT NULL,
        person_id text,
        organization_id text,
        status text NOT NULL DEFAULT 'draft',
        currency text NOT NULL,
        subtotal_cents integer NOT NULL DEFAULT 0,
        tax_cents integer NOT NULL DEFAULT 0,
        total_cents integer NOT NULL DEFAULT 0,
        paid_cents integer NOT NULL DEFAULT 0,
        balance_due_cents integer NOT NULL DEFAULT 0,
        issue_date date NOT NULL,
        due_date date NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payment_sessions (
        id text PRIMARY KEY NOT NULL,
        target_type text NOT NULL DEFAULT 'other',
        target_id text,
        booking_id text,
        invoice_id text,
        booking_payment_schedule_id text,
        booking_guarantee_id text,
        status text NOT NULL DEFAULT 'pending',
        provider text,
        currency text NOT NULL,
        amount_cents integer NOT NULL,
        payment_method text,
        payer_person_id text,
        payer_organization_id text,
        payer_email text,
        payer_name text,
        redirect_url text,
        return_url text,
        cancel_url text,
        expires_at timestamp with time zone,
        external_reference text,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id text PRIMARY KEY NOT NULL,
        slug text NOT NULL UNIQUE,
        name text NOT NULL,
        channel notification_channel NOT NULL,
        provider text,
        status notification_template_status NOT NULL DEFAULT 'draft',
        subject_template text,
        html_template text,
        text_template text,
        from_address text,
        is_system boolean NOT NULL DEFAULT false,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id text PRIMARY KEY NOT NULL,
        template_id text,
        template_slug text,
        target_type notification_target_type NOT NULL DEFAULT 'other',
        target_id text,
        person_id text,
        organization_id text,
        booking_id text,
        invoice_id text,
        payment_session_id text,
        channel notification_channel NOT NULL,
        provider text NOT NULL,
        provider_message_id text,
        status notification_delivery_status NOT NULL DEFAULT 'pending',
        to_address text NOT NULL,
        from_address text,
        subject text,
        html_body text,
        text_body text,
        payload_data jsonb,
        metadata jsonb,
        error_message text,
        scheduled_for timestamp with time zone,
        sent_at timestamp with time zone,
        failed_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_reminder_rules (
        id text PRIMARY KEY NOT NULL,
        slug text NOT NULL UNIQUE,
        name text NOT NULL,
        status notification_reminder_status NOT NULL DEFAULT 'draft',
        target_type notification_reminder_target_type NOT NULL,
        channel notification_channel NOT NULL,
        provider text,
        template_id text,
        template_slug text,
        relative_days_from_due_date integer NOT NULL DEFAULT 0,
        is_system boolean NOT NULL DEFAULT false,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_reminder_runs (
        id text PRIMARY KEY NOT NULL,
        reminder_rule_id text NOT NULL,
        target_type notification_reminder_target_type NOT NULL,
        target_id text NOT NULL,
        dedupe_key text NOT NULL UNIQUE,
        booking_id text,
        person_id text,
        organization_id text,
        payment_session_id text,
        notification_delivery_id text,
        status notification_reminder_run_status NOT NULL,
        recipient text,
        scheduled_for timestamp with time zone NOT NULL,
        processed_at timestamp with time zone DEFAULT now() NOT NULL,
        error_message text,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await cleanupNotificationsTestData(db)

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      await next()
    })
    app.route(
      "/",
      createNotificationsRoutes({
        providers: [createLocalProvider({ sink, channels: ["email"] })],
      }),
    )
  })

  beforeEach(async () => {
    sink.mockReset()
    await cleanupNotificationsTestData(db)
  })

  afterAll(async () => {
    const { closeTestDb } = await import("@voyantjs/db/test-utils")
    await closeTestDb()
  })

  it("creates and lists notification templates", async () => {
    const createRes = await app.request("/templates", {
      method: "POST",
      ...json({
        slug: "payment-reminder",
        name: "Payment Reminder",
        channel: "email",
        provider: "local",
        status: "active",
        subjectTemplate: "Reminder for {{ bookingNumber }}",
        textTemplate: "Balance due: {{ amountCents }}",
      }),
    })
    expect(createRes.status).toBe(201)
    const { data } = await createRes.json()
    expect(data.slug).toBe("payment-reminder")

    const listRes = await app.request("/templates?status=active")
    expect(listRes.status).toBe(200)
    const body = await listRes.json()
    expect(body.total).toBe(1)
    expect(body.data[0].slug).toBe("payment-reminder")
  })

  it("sends a notification from a template and persists the delivery", async () => {
    const createRes = await app.request("/templates", {
      method: "POST",
      ...json({
        slug: "payment-reminder",
        name: "Payment Reminder",
        channel: "email",
        provider: "local",
        status: "active",
        subjectTemplate: "Reminder for {{ bookingNumber }}",
        textTemplate: "Balance due: {{ amountCents }}",
      }),
    })
    const { data: template } = await createRes.json()

    const sendRes = await app.request("/send", {
      method: "POST",
      ...json({
        templateId: template.id,
        to: "traveler@example.com",
        data: {
          bookingNumber: "BK-1001",
          amountCents: 30000,
        },
        targetType: "booking",
        targetId: "book_123",
        bookingId: "book_123",
      }),
    })
    expect(sendRes.status).toBe(201)
    const { data } = await sendRes.json()
    expect(data.status).toBe("sent")
    expect(data.templateSlug).toBe("payment-reminder")
    expect(data.subject).toBe("Reminder for BK-1001")
    expect(data.textBody).toBe("Balance due: 30000")
    expect(sink).toHaveBeenCalledOnce()

    const deliveriesRes = await app.request("/deliveries?bookingId=book_123")
    const deliveries = await deliveriesRes.json()
    expect(deliveries.total).toBe(1)
    expect(deliveries.data[0].id).toBe(data.id)
  })

  it("creates and runs due payment reminder rules without duplicating runs", async () => {
    const createTemplateRes = await app.request("/templates", {
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

    await db.execute(sql`
      INSERT INTO bookings (id, booking_number, person_id, sell_currency, sell_amount_cents)
      VALUES ('book_test', 'BK-REM-1', 'person_1', 'EUR', 45000)
    `)
    await db.execute(sql`
      INSERT INTO booking_participants (id, booking_id, first_name, last_name, email, participant_type, is_primary)
      VALUES ('bkpt_test', 'book_test', 'Ana', 'Traveler', 'ana@example.com', 'traveler', true)
    `)
    await db.execute(sql`
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

    const createRuleRes = await app.request("/reminder-rules", {
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

    const runRes = await app.request("/reminders/run-due", {
      method: "POST",
      ...json({ now: "2026-04-08T09:00:00.000Z" }),
    })
    expect(runRes.status).toBe(200)
    const firstRunBody = await runRes.json()
    expect(firstRunBody.data.processed).toBe(1)
    expect(firstRunBody.data.sent).toBe(1)
    expect(sink).toHaveBeenCalledOnce()

    const runsRes = await app.request("/reminder-runs?bookingId=book_test")
    expect(runsRes.status).toBe(200)
    const runsBody = await runsRes.json()
    expect(runsBody.total).toBe(1)
    expect(runsBody.data[0].status).toBe("sent")

    const secondRunRes = await app.request("/reminders/run-due", {
      method: "POST",
      ...json({ now: "2026-04-08T10:00:00.000Z" }),
    })
    expect(secondRunRes.status).toBe(200)
    const secondRunBody = await secondRunRes.json()
    expect(secondRunBody.data.processed).toBe(0)

    const deliveriesRes = await app.request("/deliveries?targetType=booking_payment_schedule&targetId=bkpy_test")
    expect(deliveriesRes.status).toBe(200)
    const deliveriesBody = await deliveriesRes.json()
    expect(deliveriesBody.total).toBe(1)
  })

  it("sends a payment session notification with resolved recipient and payment link context", async () => {
    const createTemplateRes = await app.request("/templates", {
      method: "POST",
      ...json({
        slug: "payment-link",
        name: "Payment Link",
        channel: "email",
        provider: "local",
        status: "active",
        subjectTemplate: "Pay {{ paymentSession.amountCents }} {{ paymentSession.currency }}",
        textTemplate: "Use {{ paymentSession.redirectUrl }} for {{ booking.bookingNumber }}",
      }),
    })
    const { data: template } = await createTemplateRes.json()

    await db.execute(sql`
      INSERT INTO bookings (id, booking_number, person_id, sell_currency, sell_amount_cents)
      VALUES ('book_collect', 'BK-COLLECT-1', 'person_2', 'EUR', 60000)
    `)
    await db.execute(sql`
      INSERT INTO booking_participants (id, booking_id, first_name, last_name, email, participant_type, is_primary)
      VALUES ('bkpt_collect', 'book_collect', 'Mara', 'Client', 'mara@example.com', 'traveler', true)
    `)
    await db.execute(sql`
      INSERT INTO payment_sessions (
        id,
        target_type,
        target_id,
        booking_id,
        status,
        provider,
        currency,
        amount_cents,
        payer_email,
        redirect_url,
        external_reference
      )
      VALUES (
        'pmss_collect',
        'booking',
        'book_collect',
        'book_collect',
        'requires_redirect',
        'netopia',
        'EUR',
        30000,
        null,
        'https://pay.example.com/session/pmss_collect',
        'REF-1'
      )
    `)

    const sendRes = await app.request("/payment-sessions/pmss_collect/send", {
      method: "POST",
      ...json({
        templateId: template.id,
      }),
    })
    expect(sendRes.status).toBe(201)
    const { data } = await sendRes.json()
    expect(data.status).toBe("sent")
    expect(data.paymentSessionId).toBe("pmss_collect")
    expect(data.toAddress).toBe("mara@example.com")
    expect(data.textBody).toContain("https://pay.example.com/session/pmss_collect")
  })

  it("sends an invoice notification and includes linked payment session context", async () => {
    const createTemplateRes = await app.request("/templates", {
      method: "POST",
      ...json({
        slug: "invoice-send",
        name: "Invoice Send",
        channel: "email",
        provider: "local",
        status: "active",
        subjectTemplate: "Invoice {{ invoice.invoiceNumber }}",
        textTemplate:
          "Invoice {{ invoice.invoiceNumber }} balance {{ invoice.balanceDueCents }} {{ invoice.currency }} pay {{ paymentSession.redirectUrl }}",
      }),
    })
    const { data: template } = await createTemplateRes.json()

    await db.execute(sql`
      INSERT INTO bookings (id, booking_number, person_id, sell_currency, sell_amount_cents)
      VALUES ('book_invoice', 'BK-INV-1', 'person_3', 'EUR', 80000)
    `)
    await db.execute(sql`
      INSERT INTO booking_participants (id, booking_id, first_name, last_name, email, participant_type, is_primary)
      VALUES ('bkpt_invoice', 'book_invoice', 'Ioana', 'Client', 'ioana@example.com', 'booker', true)
    `)
    await db.execute(sql`
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
        'INV-1001',
        'invoice',
        'book_invoice',
        'person_3',
        'sent',
        'EUR',
        70000,
        10000,
        80000,
        20000,
        60000,
        DATE '2026-04-08',
        DATE '2026-04-15'
      )
    `)
    await db.execute(sql`
      INSERT INTO payment_sessions (
        id,
        target_type,
        target_id,
        booking_id,
        invoice_id,
        status,
        provider,
        currency,
        amount_cents,
        payer_email,
        redirect_url
      )
      VALUES (
        'pmss_invoice',
        'invoice',
        'inv_test',
        'book_invoice',
        'inv_test',
        'requires_redirect',
        'netopia',
        'EUR',
        60000,
        null,
        'https://pay.example.com/session/pmss_invoice'
      )
    `)

    const sendRes = await app.request("/invoices/inv_test/send", {
      method: "POST",
      ...json({
        templateId: template.id,
      }),
    })
    expect(sendRes.status).toBe(201)
    const { data } = await sendRes.json()
    expect(data.status).toBe("sent")
    expect(data.invoiceId).toBe("inv_test")
    expect(data.paymentSessionId).toBe("pmss_invoice")
    expect(data.toAddress).toBe("ioana@example.com")
    expect(data.textBody).toContain("INV-1001")
    expect(data.textBody).toContain("https://pay.example.com/session/pmss_invoice")
  })
})
