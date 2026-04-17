import { bookings } from "@voyantjs/bookings/schema"
import { and, asc, desc, eq, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import {
  bookingGuarantees,
  bookingPaymentSchedules,
  invoiceRenditions,
  invoices,
  paymentInstruments,
  payments,
} from "./schema.js"
import { financeService } from "./service.js"
import type {
  PublicBookingFinanceDocuments,
  PublicBookingFinancePayments,
  PublicFinanceBookingDocument,
  PublicFinanceDocumentLookup,
  PublicPaymentOptionsQuery,
  PublicStartPaymentSessionInput,
  PublicValidateVoucherInput,
} from "./validation-public.js"

export interface PublicFinanceRuntimeOptions {
  resolveDocumentDownloadUrl?: (storageKey: string) => Promise<string | null> | string | null
}

function normalizeDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  return value instanceof Date ? value.toISOString() : value
}

function isDefaultInstrument(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false
  }

  const record = metadata as Record<string, unknown>
  return record.default === true || record.isDefault === true
}

function getMetadataRecord(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null
  }

  return metadata as Record<string, unknown>
}

function getMetadataString(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key]
  return typeof value === "string" && value.length > 0 ? value : null
}

function getMetadataNumber(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function getMetadataStringArray(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key]
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
}

function maybeUrl(value: string | null | undefined) {
  if (!value) {
    return null
  }

  return /^https?:\/\//i.test(value) ? value : null
}

function getMetadataDownloadUrl(record: Record<string, unknown> | null) {
  const directKeys = [
    "downloadUrl",
    "download_url",
    "signedUrl",
    "signed_url",
    "publicUrl",
    "public_url",
    "fileUrl",
    "file_url",
    "url",
  ]

  for (const key of directKeys) {
    const value = getMetadataString(record, key)
    const url = maybeUrl(value)
    if (url) {
      return url
    }
  }

  const artifact = record?.artifact
  if (artifact && typeof artifact === "object" && !Array.isArray(artifact)) {
    const nested = artifact as Record<string, unknown>
    for (const key of ["downloadUrl", "download_url", "signedUrl", "publicUrl", "url"]) {
      const value = nested[key]
      if (typeof value === "string") {
        const url = maybeUrl(value)
        if (url) {
          return url
        }
      }
    }
  }

  return null
}

function toPublicPaymentSession(
  session: NonNullable<Awaited<ReturnType<typeof financeService.getPaymentSessionById>>>,
) {
  return {
    id: session.id,
    targetType: session.targetType,
    targetId: session.targetId ?? null,
    bookingId: session.bookingId ?? null,
    invoiceId: session.invoiceId ?? null,
    bookingPaymentScheduleId: session.bookingPaymentScheduleId ?? null,
    bookingGuaranteeId: session.bookingGuaranteeId ?? null,
    status: session.status,
    provider: session.provider ?? null,
    providerSessionId: session.providerSessionId ?? null,
    providerPaymentId: session.providerPaymentId ?? null,
    externalReference: session.externalReference ?? null,
    clientReference: session.clientReference ?? null,
    currency: session.currency,
    amountCents: session.amountCents,
    paymentMethod: session.paymentMethod ?? null,
    payerEmail: session.payerEmail ?? null,
    payerName: session.payerName ?? null,
    redirectUrl: session.redirectUrl ?? null,
    returnUrl: session.returnUrl ?? null,
    cancelUrl: session.cancelUrl ?? null,
    expiresAt: normalizeDateTime(session.expiresAt),
    completedAt: normalizeDateTime(session.completedAt),
    failureCode: session.failureCode ?? null,
    failureMessage: session.failureMessage ?? null,
  }
}

async function mapInvoiceDocument(
  invoice: typeof invoices.$inferSelect,
  renditions: Array<typeof invoiceRenditions.$inferSelect>,
  runtime: PublicFinanceRuntimeOptions = {},
): Promise<PublicFinanceBookingDocument> {
  const selectedRendition =
    renditions.find((rendition) => rendition.status === "ready") ?? renditions[0] ?? null
  const metadata = getMetadataRecord(selectedRendition?.metadata ?? null)
  const resolvedDownloadUrl =
    selectedRendition?.storageKey && runtime.resolveDocumentDownloadUrl
      ? await runtime.resolveDocumentDownloadUrl(selectedRendition.storageKey)
      : null
  const downloadUrl =
    resolvedDownloadUrl ??
    getMetadataDownloadUrl(metadata) ??
    maybeUrl(selectedRendition?.storageKey ?? null)

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.invoiceType,
    invoiceStatus: invoice.status,
    currency: invoice.currency,
    totalCents: invoice.totalCents,
    paidCents: invoice.paidCents,
    balanceDueCents: invoice.balanceDueCents,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    renditionId: selectedRendition?.id ?? null,
    documentStatus: selectedRendition?.status ?? "missing",
    format: selectedRendition?.format ?? null,
    language: selectedRendition?.language ?? null,
    generatedAt: normalizeDateTime(selectedRendition?.generatedAt),
    fileSize: selectedRendition?.fileSize ?? null,
    checksum: selectedRendition?.checksum ?? null,
    downloadUrl,
  }
}

export const publicFinanceService = {
  async getBookingDocuments(
    db: PostgresJsDatabase,
    bookingId: string,
    runtime: PublicFinanceRuntimeOptions = {},
  ): Promise<PublicBookingFinanceDocuments | null> {
    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      return null
    }

    const invoiceRows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.bookingId, bookingId))
      .orderBy(desc(invoices.createdAt))

    if (invoiceRows.length === 0) {
      return { bookingId, documents: [] }
    }

    const renditionRows = await db
      .select()
      .from(invoiceRenditions)
      .where(or(...invoiceRows.map((invoice) => eq(invoiceRenditions.invoiceId, invoice.id))))
      .orderBy(desc(invoiceRenditions.createdAt))

    const renditionByInvoiceId = new Map<string, (typeof invoiceRenditions.$inferSelect)[]>()
    for (const rendition of renditionRows) {
      const existing = renditionByInvoiceId.get(rendition.invoiceId) ?? []
      existing.push(rendition)
      renditionByInvoiceId.set(rendition.invoiceId, existing)
    }

    return {
      bookingId,
      documents: await Promise.all(
        invoiceRows.map((invoice) =>
          mapInvoiceDocument(invoice, renditionByInvoiceId.get(invoice.id) ?? [], runtime),
        ),
      ),
    }
  },

  async getDocumentByReference(
    db: PostgresJsDatabase,
    reference: string,
    runtime: PublicFinanceRuntimeOptions = {},
  ): Promise<PublicFinanceDocumentLookup | null> {
    const [invoiceMatch, paymentMatch] = await Promise.all([
      db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, reference))
        .orderBy(desc(invoices.createdAt))
        .limit(1),
      db
        .select({
          invoiceId: payments.invoiceId,
        })
        .from(payments)
        .where(eq(payments.referenceNumber, reference))
        .orderBy(desc(payments.createdAt))
        .limit(1),
    ])

    const invoiceId = invoiceMatch[0]?.id ?? paymentMatch[0]?.invoiceId ?? null
    if (!invoiceId) {
      return null
    }

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1)

    if (!invoice?.bookingId) {
      return null
    }

    const renditions = await db
      .select()
      .from(invoiceRenditions)
      .where(eq(invoiceRenditions.invoiceId, invoice.id))
      .orderBy(desc(invoiceRenditions.createdAt))

    return {
      bookingId: invoice.bookingId,
      ...(await mapInvoiceDocument(invoice, renditions, runtime)),
    }
  },

  async getBookingPaymentOptions(
    db: PostgresJsDatabase,
    bookingId: string,
    query: PublicPaymentOptionsQuery,
  ) {
    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      return null
    }

    const instrumentConditions = [eq(paymentInstruments.ownerType, "client")]
    if (!query.includeInactive) {
      instrumentConditions.push(eq(paymentInstruments.status, "active"))
    }
    if (query.personId) {
      instrumentConditions.push(eq(paymentInstruments.personId, query.personId))
    }
    if (query.organizationId) {
      instrumentConditions.push(eq(paymentInstruments.organizationId, query.organizationId))
    }
    if (query.provider) {
      instrumentConditions.push(eq(paymentInstruments.provider, query.provider))
    }
    if (query.instrumentType) {
      instrumentConditions.push(eq(paymentInstruments.instrumentType, query.instrumentType))
    }

    const [accounts, schedules, guarantees] = await Promise.all([
      db
        .select()
        .from(paymentInstruments)
        .where(and(...instrumentConditions))
        .orderBy(desc(paymentInstruments.updatedAt))
        .limit(50),
      db
        .select()
        .from(bookingPaymentSchedules)
        .where(
          and(
            eq(bookingPaymentSchedules.bookingId, bookingId),
            or(
              eq(bookingPaymentSchedules.status, "pending"),
              eq(bookingPaymentSchedules.status, "due"),
            ),
          ),
        )
        .orderBy(asc(bookingPaymentSchedules.dueDate), asc(bookingPaymentSchedules.createdAt)),
      db
        .select()
        .from(bookingGuarantees)
        .where(
          and(
            eq(bookingGuarantees.bookingId, bookingId),
            or(
              eq(bookingGuarantees.status, "pending"),
              eq(bookingGuarantees.status, "failed"),
              eq(bookingGuarantees.status, "expired"),
            ),
          ),
        )
        .orderBy(desc(bookingGuarantees.createdAt)),
    ])

    const recommendedSchedule = schedules[0] ?? null
    const recommendedGuarantee = recommendedSchedule === null ? (guarantees[0] ?? null) : null

    return {
      bookingId,
      accounts: accounts.map((account) => ({
        id: account.id,
        label: account.label,
        provider: account.provider ?? null,
        instrumentType: account.instrumentType,
        status: account.status,
        brand: account.brand ?? null,
        last4: account.last4 ?? null,
        expiryMonth: account.expiryMonth ?? null,
        expiryYear: account.expiryYear ?? null,
        isDefault: isDefaultInstrument(account.metadata),
      })),
      schedules: schedules.map((schedule) => ({
        id: schedule.id,
        scheduleType: schedule.scheduleType,
        status: schedule.status,
        dueDate: schedule.dueDate,
        currency: schedule.currency,
        amountCents: schedule.amountCents,
        notes: schedule.notes ?? null,
      })),
      guarantees: guarantees.map((guarantee) => ({
        id: guarantee.id,
        bookingPaymentScheduleId: guarantee.bookingPaymentScheduleId ?? null,
        guaranteeType: guarantee.guaranteeType,
        status: guarantee.status,
        currency: guarantee.currency ?? null,
        amountCents: guarantee.amountCents ?? null,
        provider: guarantee.provider ?? null,
        referenceNumber: guarantee.referenceNumber ?? null,
        expiresAt: normalizeDateTime(guarantee.expiresAt),
        notes: guarantee.notes ?? null,
      })),
      recommendedTarget:
        recommendedSchedule || recommendedGuarantee
          ? {
              targetType: recommendedSchedule
                ? ("booking_payment_schedule" as const)
                : ("booking_guarantee" as const),
              targetId: recommendedSchedule?.id ?? recommendedGuarantee?.id ?? null,
            }
          : null,
    }
  },

  async getBookingPayments(
    db: PostgresJsDatabase,
    bookingId: string,
  ): Promise<PublicBookingFinancePayments | null> {
    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      return null
    }

    const invoiceRows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceType: invoices.invoiceType,
      })
      .from(invoices)
      .where(eq(invoices.bookingId, bookingId))
      .orderBy(desc(invoices.createdAt))

    if (invoiceRows.length === 0) {
      return { bookingId, payments: [] }
    }

    const invoiceById = new Map(invoiceRows.map((invoice) => [invoice.id, invoice]))
    const paymentRows = await db
      .select()
      .from(payments)
      .where(or(...invoiceRows.map((invoice) => eq(payments.invoiceId, invoice.id))))
      .orderBy(desc(payments.paymentDate), desc(payments.createdAt))

    return {
      bookingId,
      payments: paymentRows.flatMap((payment) => {
        const invoice = invoiceById.get(payment.invoiceId)
        if (!invoice) {
          return []
        }

        return [
          {
            id: payment.id,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            invoiceType: invoice.invoiceType,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            amountCents: payment.amountCents,
            currency: payment.currency,
            paymentDate: payment.paymentDate,
            referenceNumber: payment.referenceNumber ?? null,
            notes: payment.notes ?? null,
          },
        ]
      }),
    }
  },

  async getPaymentSession(db: PostgresJsDatabase, sessionId: string) {
    const session = await financeService.getPaymentSessionById(db, sessionId)
    return session ? toPublicPaymentSession(session) : null
  },

  async startBookingSchedulePaymentSession(
    db: PostgresJsDatabase,
    bookingId: string,
    scheduleId: string,
    input: PublicStartPaymentSessionInput,
  ) {
    const [schedule] = await db
      .select({
        id: bookingPaymentSchedules.id,
      })
      .from(bookingPaymentSchedules)
      .where(
        and(
          eq(bookingPaymentSchedules.id, scheduleId),
          eq(bookingPaymentSchedules.bookingId, bookingId),
        ),
      )
      .limit(1)

    if (!schedule) {
      return null
    }

    const session = await financeService.createPaymentSessionFromBookingSchedule(
      db,
      scheduleId,
      input,
    )
    return session ? toPublicPaymentSession(session) : null
  },

  async startBookingGuaranteePaymentSession(
    db: PostgresJsDatabase,
    bookingId: string,
    guaranteeId: string,
    input: PublicStartPaymentSessionInput,
  ) {
    const [guarantee] = await db
      .select({
        id: bookingGuarantees.id,
      })
      .from(bookingGuarantees)
      .where(and(eq(bookingGuarantees.id, guaranteeId), eq(bookingGuarantees.bookingId, bookingId)))
      .limit(1)

    if (!guarantee) {
      return null
    }

    const session = await financeService.createPaymentSessionFromBookingGuarantee(
      db,
      guaranteeId,
      input,
    )
    return session ? toPublicPaymentSession(session) : null
  },

  async startInvoicePaymentSession(
    db: PostgresJsDatabase,
    invoiceId: string,
    input: PublicStartPaymentSessionInput,
  ) {
    const session = await financeService.createPaymentSessionFromInvoice(db, invoiceId, input)
    return session ? toPublicPaymentSession(session) : null
  },

  async validateVoucher(db: PostgresJsDatabase, input: PublicValidateVoucherInput) {
    const normalizedCode = input.code.trim().toLowerCase()
    const voucherConditions = [
      eq(paymentInstruments.instrumentType, "voucher"),
      or(
        sql`lower(coalesce(${paymentInstruments.externalToken}, '')) = ${normalizedCode}`,
        sql`lower(coalesce(${paymentInstruments.directBillReference}, '')) = ${normalizedCode}`,
        sql`lower(coalesce(${paymentInstruments.metadata} ->> 'code', '')) = ${normalizedCode}`,
      ),
    ]

    if (input.provider) {
      voucherConditions.push(eq(paymentInstruments.provider, input.provider))
    }

    const [voucher] = await db
      .select()
      .from(paymentInstruments)
      .where(and(...voucherConditions))
      .orderBy(desc(paymentInstruments.updatedAt))
      .limit(1)

    if (!voucher) {
      return { valid: false as const, reason: "not_found" as const, voucher: null }
    }

    const metadata = getMetadataRecord(voucher.metadata)
    const voucherCode =
      getMetadataString(metadata, "code") ??
      voucher.externalToken ??
      voucher.directBillReference ??
      input.code
    const currency = getMetadataString(metadata, "currency")
    const amountCents = getMetadataNumber(metadata, "amountCents")
    const remainingAmountCents = getMetadataNumber(metadata, "remainingAmountCents") ?? amountCents
    const validFrom = getMetadataString(metadata, "validFrom")
    const expiresAt = getMetadataString(metadata, "expiresAt")
    const bookingIds = getMetadataStringArray(metadata, "bookingIds")
    const bookingId = getMetadataString(metadata, "bookingId")
    const appliesToBookingIds = bookingId ? [bookingId, ...bookingIds] : bookingIds

    const publicVoucher = {
      id: voucher.id,
      code: voucherCode,
      label: voucher.label,
      provider: voucher.provider ?? null,
      currency,
      amountCents,
      remainingAmountCents,
      expiresAt,
    }

    if (voucher.status !== "active") {
      return { valid: false as const, reason: "inactive" as const, voucher: publicVoucher }
    }

    if (validFrom && new Date(validFrom) > new Date()) {
      return { valid: false as const, reason: "not_started" as const, voucher: publicVoucher }
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return { valid: false as const, reason: "expired" as const, voucher: publicVoucher }
    }

    if (
      input.bookingId &&
      appliesToBookingIds.length > 0 &&
      !appliesToBookingIds.includes(input.bookingId)
    ) {
      return { valid: false as const, reason: "booking_mismatch" as const, voucher: publicVoucher }
    }

    if (input.currency && currency && input.currency !== currency) {
      return {
        valid: false as const,
        reason: "currency_mismatch" as const,
        voucher: publicVoucher,
      }
    }

    if (
      input.amountCents &&
      remainingAmountCents !== null &&
      input.amountCents > remainingAmountCents
    ) {
      return {
        valid: false as const,
        reason: "insufficient_balance" as const,
        voucher: publicVoucher,
      }
    }

    return { valid: true as const, reason: null, voucher: publicVoucher }
  },
}
