import { bookingItems, bookingParticipants, bookings } from "@voyantjs/bookings"
import {
  bookingPaymentSchedules,
  financeService,
  invoiceLineItems,
  invoiceNumberSeries,
  invoices,
  type PaymentSession,
} from "@voyantjs/finance"
import type {
  NotificationDelivery,
  NotificationService,
} from "@voyantjs/notifications"
import { notificationsService } from "@voyantjs/notifications"
import { and, asc, desc, eq, gt, inArray } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import type {
  InitiateCheckoutCollectionInput,
  PreviewCheckoutCollectionInput,
} from "./validation.js"

export interface CheckoutPolicyOptions {
  defaultCardCollectionTarget?: "schedule" | "invoice"
  defaultReminderCardCollectionTarget?: "schedule" | "invoice"
  defaultBankTransferDocumentType?: "proforma" | "invoice"
  defaultPaymentPlan?: {
    depositMode: "none" | "percentage" | "fixed_amount"
    depositValue: number
    balanceDueDaysBeforeStart: number
    clearExistingPending: boolean
    createGuarantee: boolean
    guaranteeType: "deposit" | "credit_card" | "preauth" | "card_on_file" | "bank_transfer" | "voucher" | "agency_letter"
    notes?: string | null
  }
}

type LoadedBookingContext = {
  booking: typeof bookings.$inferSelect
  items: Array<typeof bookingItems.$inferSelect>
  participants: Array<typeof bookingParticipants.$inferSelect>
  schedules: Array<typeof bookingPaymentSchedules.$inferSelect>
  outstandingInvoices: Array<typeof invoices.$inferSelect>
}

export interface CheckoutCollectionPlan {
  bookingId: string
  method: "card" | "bank_transfer"
  stage: "initial" | "reminder" | "manual"
  paymentSessionTarget: "schedule" | "invoice" | null
  documentType: "proforma" | "invoice" | null
  willCreateDefaultPaymentPlan: boolean
  selectedSchedule: typeof bookingPaymentSchedules.$inferSelect | null
  selectedInvoice: typeof invoices.$inferSelect | null
  amountCents: number
  currency: string
  recommendedAction:
    | "create_bank_transfer_document"
    | "create_payment_session"
    | "create_invoice_then_payment_session"
    | "none"
}

export interface InitiatedCheckoutCollection {
  plan: CheckoutCollectionPlan
  invoice: typeof invoices.$inferSelect | null
  paymentSession: PaymentSession | null
  invoiceNotification: NotificationDelivery | null
  paymentSessionNotification: NotificationDelivery | null
}

const OUTSTANDING_SCHEDULE_STATUSES: Array<(typeof bookingPaymentSchedules.$inferSelect)["status"]> = [
  "pending",
  "due",
]
const OUTSTANDING_INVOICE_STATUSES: Array<(typeof invoices.$inferSelect)["status"]> = [
  "draft",
  "sent",
  "partially_paid",
  "overdue",
]

function defaultPaymentPlan(options: CheckoutPolicyOptions) {
  return {
    depositMode: options.defaultPaymentPlan?.depositMode ?? "percentage",
    depositValue: options.defaultPaymentPlan?.depositValue ?? 30,
    balanceDueDaysBeforeStart: options.defaultPaymentPlan?.balanceDueDaysBeforeStart ?? 30,
    clearExistingPending: options.defaultPaymentPlan?.clearExistingPending ?? true,
    createGuarantee: options.defaultPaymentPlan?.createGuarantee ?? false,
    guaranteeType: options.defaultPaymentPlan?.guaranteeType ?? "deposit",
    notes: options.defaultPaymentPlan?.notes ?? null,
  } as const
}

export function resolvePaymentSessionTarget(
  method: "card" | "bank_transfer",
  stage: "initial" | "reminder" | "manual",
  override: "schedule" | "invoice" | undefined,
  options: CheckoutPolicyOptions,
) {
  if (method === "bank_transfer") return "invoice" as const
  if (override) return override
  if (stage === "reminder") return options.defaultReminderCardCollectionTarget ?? "schedule"
  return options.defaultCardCollectionTarget ?? "schedule"
}

function resolveDocumentType(
  method: "card" | "bank_transfer",
  target: "schedule" | "invoice" | null,
  options: CheckoutPolicyOptions,
) {
  if (method === "bank_transfer") {
    return options.defaultBankTransferDocumentType ?? "proforma"
  }
  if (target === "invoice") {
    return "invoice" as const
  }
  return null
}

function fallbackInvoiceNumber(
  bookingNumber: string,
  documentType: "proforma" | "invoice",
  amountCents: number,
) {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = documentType === "proforma" ? "PF" : "INV"
  return `${bookingNumber}-${suffix}-${amountCents}-${stamp}`
}

function lineDescription(
  booking: typeof bookings.$inferSelect,
  schedule: typeof bookingPaymentSchedules.$inferSelect | null,
  stage: "initial" | "reminder" | "manual",
) {
  if (!schedule) {
    return `Booking ${booking.bookingNumber}`
  }
  const kind = schedule.scheduleType === "deposit" ? "deposit" : schedule.scheduleType
  if (stage === "reminder") {
    return `Booking ${booking.bookingNumber} ${kind} reminder`
  }
  return `Booking ${booking.bookingNumber} ${kind}`
}

async function loadBookingContext(db: PostgresJsDatabase, bookingId: string): Promise<LoadedBookingContext | null> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
  if (!booking) return null

  const [items, participants, schedules, outstandingInvoices] = await Promise.all([
    db.select().from(bookingItems).where(eq(bookingItems.bookingId, bookingId)).orderBy(bookingItems.createdAt),
    db
      .select()
      .from(bookingParticipants)
      .where(eq(bookingParticipants.bookingId, bookingId))
      .orderBy(desc(bookingParticipants.isPrimary), bookingParticipants.createdAt),
    db
      .select()
      .from(bookingPaymentSchedules)
      .where(
        and(
          eq(bookingPaymentSchedules.bookingId, bookingId),
          inArray(bookingPaymentSchedules.status, OUTSTANDING_SCHEDULE_STATUSES),
        ),
      )
      .orderBy(asc(bookingPaymentSchedules.dueDate), asc(bookingPaymentSchedules.createdAt)),
    db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.bookingId, bookingId),
          inArray(invoices.status, OUTSTANDING_INVOICE_STATUSES),
          gt(invoices.balanceDueCents, 0),
        ),
      )
      .orderBy(desc(invoices.createdAt)),
  ])

  return {
    booking,
    items,
    participants,
    schedules,
    outstandingInvoices,
  }
}

async function ensurePaymentPlanIfNeeded(
  db: PostgresJsDatabase,
  bookingId: string,
  existingSchedules: Array<typeof bookingPaymentSchedules.$inferSelect>,
  input: PreviewCheckoutCollectionInput | InitiateCheckoutCollectionInput,
  options: CheckoutPolicyOptions,
) {
  if (existingSchedules.length > 0 || !input.ensureDefaultPaymentPlan) {
    return existingSchedules
  }

  const created = await financeService.applyDefaultBookingPaymentPlan(db, bookingId, {
    ...defaultPaymentPlan(options),
    ...(input.paymentPlan ?? {}),
  })

  return created ?? []
}

async function allocateDocumentNumber(
  db: PostgresJsDatabase,
  bookingNumber: string,
  documentType: "proforma" | "invoice",
  amountCents: number,
) {
  const [series] = await db
    .select()
    .from(invoiceNumberSeries)
    .where(eq(invoiceNumberSeries.scope, documentType))
    .orderBy(desc(invoiceNumberSeries.active), asc(invoiceNumberSeries.createdAt))
    .limit(1)

  if (!series) {
    return fallbackInvoiceNumber(bookingNumber, documentType, amountCents)
  }

  const allocated = await financeService.allocateInvoiceNumber(db, series.id)
  if (allocated.status === "allocated") {
    return allocated.formattedNumber
  }

  return fallbackInvoiceNumber(bookingNumber, documentType, amountCents)
}

function pickSchedule(
  schedules: Array<typeof bookingPaymentSchedules.$inferSelect>,
  scheduleId?: string,
) {
  if (scheduleId) {
    return schedules.find((schedule) => schedule.id === scheduleId) ?? null
  }
  return schedules[0] ?? null
}

function pickInvoice(
  outstandingInvoices: Array<typeof invoices.$inferSelect>,
  invoiceId?: string,
) {
  if (invoiceId) {
    return outstandingInvoices.find((invoice) => invoice.id === invoiceId) ?? null
  }
  return outstandingInvoices[0] ?? null
}

export async function previewCheckoutCollection(
  db: PostgresJsDatabase,
  bookingId: string,
  input: PreviewCheckoutCollectionInput,
  options: CheckoutPolicyOptions = {},
): Promise<CheckoutCollectionPlan | null> {
  const context = await loadBookingContext(db, bookingId)
  if (!context) return null

  const schedules = await ensurePaymentPlanIfNeeded(
    db,
    bookingId,
    context.schedules,
    input,
    options,
  )

  const paymentSessionTarget = resolvePaymentSessionTarget(
    input.method,
    input.stage,
    input.paymentSessionTarget,
    options,
  )
  const documentType = resolveDocumentType(input.method, paymentSessionTarget, options)
  const selectedSchedule = pickSchedule(schedules, input.scheduleId)
  const selectedInvoice = pickInvoice(context.outstandingInvoices, input.invoiceId)

  let amountCents = 0
  if (paymentSessionTarget === "invoice") {
    amountCents = selectedInvoice?.balanceDueCents ?? selectedSchedule?.amountCents ?? context.booking.sellAmountCents ?? 0
  } else if (paymentSessionTarget === "schedule") {
    amountCents = selectedSchedule?.amountCents ?? context.booking.sellAmountCents ?? 0
  }

  let recommendedAction: CheckoutCollectionPlan["recommendedAction"] = "none"
  if (input.method === "bank_transfer") {
    recommendedAction = "create_bank_transfer_document"
  } else if (paymentSessionTarget === "invoice") {
    recommendedAction = selectedInvoice ? "create_payment_session" : "create_invoice_then_payment_session"
  } else if (paymentSessionTarget === "schedule") {
    recommendedAction = "create_payment_session"
  }

  return {
    bookingId,
    method: input.method,
    stage: input.stage,
    paymentSessionTarget,
    documentType,
    willCreateDefaultPaymentPlan: context.schedules.length === 0 && schedules.length > 0,
    selectedSchedule,
    selectedInvoice,
    amountCents,
    currency: context.booking.sellCurrency,
    recommendedAction,
  }
}

async function createCollectionInvoice(
  db: PostgresJsDatabase,
  context: LoadedBookingContext,
  plan: CheckoutCollectionPlan,
  notes?: string | null,
) {
  const amountCents = plan.amountCents
  const issueDate = new Date().toISOString().slice(0, 10)
  const dueDate = plan.selectedSchedule?.dueDate ?? issueDate
  const documentType = plan.documentType ?? "invoice"
  const invoiceNumber = await allocateDocumentNumber(
    db,
    context.booking.bookingNumber,
    documentType,
    amountCents,
  )

  const [invoice] = await db
    .insert(invoices)
    .values({
      invoiceNumber,
      bookingId: context.booking.id,
      personId: context.booking.personId,
      organizationId: context.booking.organizationId,
      invoiceType: documentType,
      status: "sent",
      currency: context.booking.sellCurrency,
      baseCurrency: context.booking.baseCurrency,
      fxRateSetId: null,
      subtotalCents: amountCents,
      baseSubtotalCents: context.booking.baseSellAmountCents,
      taxCents: 0,
      baseTaxCents: null,
      totalCents: amountCents,
      baseTotalCents: context.booking.baseSellAmountCents,
      paidCents: 0,
      basePaidCents: 0,
      balanceDueCents: amountCents,
      baseBalanceDueCents: context.booking.baseSellAmountCents,
      commissionAmountCents: null,
      issueDate,
      dueDate,
      notes: notes ?? plan.selectedSchedule?.notes ?? null,
    })
    .returning()

  if (!invoice) {
    throw new Error("Failed to create collection invoice")
  }

  await db.insert(invoiceLineItems).values({
    invoiceId: invoice.id,
    bookingItemId: plan.selectedSchedule?.bookingItemId ?? null,
    description: lineDescription(context.booking, plan.selectedSchedule, plan.stage),
    quantity: 1,
    unitPriceCents: amountCents,
    totalCents: amountCents,
    taxRate: null,
    sortOrder: 0,
  })

  return invoice
}

export async function initiateCheckoutCollection(
  db: PostgresJsDatabase,
  bookingId: string,
  input: InitiateCheckoutCollectionInput,
  options: CheckoutPolicyOptions = {},
  dispatcher?: NotificationService,
): Promise<InitiatedCheckoutCollection | null> {
  const context = await loadBookingContext(db, bookingId)
  if (!context) return null

  const plan = await previewCheckoutCollection(db, bookingId, input, options)
  if (!plan) return null
  if (plan.amountCents <= 0) {
    throw new Error("No outstanding amount available for collection")
  }

  let invoice = plan.selectedInvoice
  let paymentSession: PaymentSession | null = null
  let invoiceNotification: NotificationDelivery | null = null
  let paymentSessionNotification: NotificationDelivery | null = null

  if (input.method === "bank_transfer") {
    invoice = await createCollectionInvoice(db, context, plan, input.notes ?? null)

    if (dispatcher && input.invoiceNotification) {
      invoiceNotification = await notificationsService.sendInvoiceNotification(
        db,
        dispatcher,
        invoice.id,
        input.invoiceNotification,
      )
    }
  } else if (plan.paymentSessionTarget === "invoice") {
    if (!invoice) {
      invoice = await createCollectionInvoice(db, context, { ...plan, documentType: "invoice" }, input.notes ?? null)
    }

    paymentSession = await financeService.createPaymentSessionFromInvoice(db, invoice.id, {
      ...(input.paymentSession ?? {}),
      notes: input.notes ?? input.paymentSession?.notes ?? null,
    })

    if (!paymentSession) {
      throw new Error("Failed to create payment session from invoice")
    }

    if (dispatcher && input.invoiceNotification) {
      invoiceNotification = await notificationsService.sendInvoiceNotification(
        db,
        dispatcher,
        invoice.id,
        input.invoiceNotification,
      )
    }

    if (dispatcher && input.paymentSessionNotification) {
      paymentSessionNotification = await notificationsService.sendPaymentSessionNotification(
        db,
        dispatcher,
        paymentSession.id,
        input.paymentSessionNotification,
      )
    }
  } else {
    if (!plan.selectedSchedule) {
      throw new Error("No outstanding payment schedule available for collection")
    }

    paymentSession = await financeService.createPaymentSessionFromBookingSchedule(
      db,
      plan.selectedSchedule.id,
      {
        ...(input.paymentSession ?? {}),
        notes: input.notes ?? input.paymentSession?.notes ?? null,
      },
    )

    if (!paymentSession) {
      throw new Error("Failed to create payment session from booking schedule")
    }

    if (dispatcher && input.paymentSessionNotification) {
      paymentSessionNotification = await notificationsService.sendPaymentSessionNotification(
        db,
        dispatcher,
        paymentSession.id,
        input.paymentSessionNotification,
      )
    }
  }

  return {
    plan,
    invoice: invoice ?? null,
    paymentSession,
    invoiceNotification,
    paymentSessionNotification,
  }
}
