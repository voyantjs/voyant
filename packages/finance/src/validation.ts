import { z } from "zod"

const invoiceStatusSchema = z.enum(["draft", "sent", "partially_paid", "paid", "overdue", "void"])
const paymentMethodSchema = z.enum([
  "bank_transfer",
  "credit_card",
  "debit_card",
  "cash",
  "cheque",
  "wallet",
  "direct_bill",
  "voucher",
  "other",
])
const paymentStatusSchema = z.enum(["pending", "completed", "failed", "refunded"])
const paymentSessionStatusSchema = z.enum([
  "pending",
  "requires_redirect",
  "processing",
  "authorized",
  "paid",
  "failed",
  "cancelled",
  "expired",
])
const paymentSessionTargetTypeSchema = z.enum([
  "booking",
  "order",
  "invoice",
  "booking_payment_schedule",
  "booking_guarantee",
  "other",
])
const paymentInstrumentTypeSchema = z.enum([
  "credit_card",
  "debit_card",
  "bank_account",
  "wallet",
  "voucher",
  "direct_bill",
  "cash",
  "other",
])
const paymentInstrumentOwnerTypeSchema = z.enum([
  "client",
  "supplier",
  "channel",
  "agency",
  "internal",
  "other",
])
const paymentInstrumentStatusSchema = z.enum([
  "active",
  "inactive",
  "expired",
  "revoked",
  "failed_verification",
])
const paymentAuthorizationStatusSchema = z.enum([
  "pending",
  "authorized",
  "partially_captured",
  "captured",
  "voided",
  "failed",
  "expired",
])
const paymentCaptureStatusSchema = z.enum(["pending", "completed", "failed", "refunded", "voided"])
const captureModeSchema = z.enum(["automatic", "manual"])
const creditNoteStatusSchema = z.enum(["draft", "issued", "applied"])
const paymentScheduleTypeSchema = z.enum(["deposit", "installment", "balance", "hold", "other"])
const paymentScheduleStatusSchema = z.enum([
  "pending",
  "due",
  "paid",
  "waived",
  "cancelled",
  "expired",
])
const guaranteeTypeSchema = z.enum([
  "deposit",
  "credit_card",
  "preauth",
  "card_on_file",
  "bank_transfer",
  "voucher",
  "agency_letter",
  "other",
])
const guaranteeStatusSchema = z.enum([
  "pending",
  "active",
  "released",
  "failed",
  "cancelled",
  "expired",
])
const taxScopeSchema = z.enum(["included", "excluded", "withheld"])
const commissionRecipientTypeSchema = z.enum([
  "channel",
  "affiliate",
  "agency",
  "agent",
  "internal",
  "supplier",
  "other",
])
const commissionModelSchema = z.enum(["percentage", "fixed", "markup", "net"])
const commissionStatusSchema = z.enum(["pending", "accrued", "payable", "paid", "void"])

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// ---------- payment instruments ----------

const paymentInstrumentCoreSchema = z.object({
  ownerType: paymentInstrumentOwnerTypeSchema.default("client"),
  personId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  channelId: z.string().optional().nullable(),
  instrumentType: paymentInstrumentTypeSchema,
  status: paymentInstrumentStatusSchema.default("active"),
  label: z.string().min(1).max(255),
  provider: z.string().max(255).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  last4: z.string().max(4).optional().nullable(),
  holderName: z.string().max(255).optional().nullable(),
  expiryMonth: z.number().int().min(1).max(12).optional().nullable(),
  expiryYear: z.number().int().min(2000).max(9999).optional().nullable(),
  externalToken: z.string().max(255).optional().nullable(),
  externalCustomerId: z.string().max(255).optional().nullable(),
  billingEmail: z.string().email().optional().nullable(),
  billingAddress: z.string().max(2000).optional().nullable(),
  directBillReference: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const insertPaymentInstrumentSchema = paymentInstrumentCoreSchema
export const updatePaymentInstrumentSchema = paymentInstrumentCoreSchema.partial()
export const paymentInstrumentListQuerySchema = paginationSchema.extend({
  ownerType: paymentInstrumentOwnerTypeSchema.optional(),
  personId: z.string().optional(),
  organizationId: z.string().optional(),
  supplierId: z.string().optional(),
  channelId: z.string().optional(),
  status: paymentInstrumentStatusSchema.optional(),
  instrumentType: paymentInstrumentTypeSchema.optional(),
  search: z.string().optional(),
})

// ---------- payment sessions ----------

const paymentSessionCoreSchema = z.object({
  targetType: paymentSessionTargetTypeSchema.default("other"),
  targetId: z.string().optional().nullable(),
  bookingId: z.string().optional().nullable(),
  orderId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  bookingPaymentScheduleId: z.string().optional().nullable(),
  bookingGuaranteeId: z.string().optional().nullable(),
  paymentInstrumentId: z.string().optional().nullable(),
  paymentAuthorizationId: z.string().optional().nullable(),
  paymentCaptureId: z.string().optional().nullable(),
  paymentId: z.string().optional().nullable(),
  status: paymentSessionStatusSchema.default("pending"),
  provider: z.string().max(255).optional().nullable(),
  providerSessionId: z.string().max(255).optional().nullable(),
  providerPaymentId: z.string().max(255).optional().nullable(),
  externalReference: z.string().max(255).optional().nullable(),
  idempotencyKey: z.string().max(255).optional().nullable(),
  clientReference: z.string().max(255).optional().nullable(),
  currency: z.string().min(3).max(3),
  amountCents: z.number().int().min(1),
  paymentMethod: paymentMethodSchema.optional().nullable(),
  payerPersonId: z.string().optional().nullable(),
  payerOrganizationId: z.string().optional().nullable(),
  payerEmail: z.string().email().optional().nullable(),
  payerName: z.string().max(255).optional().nullable(),
  redirectUrl: z.string().url().optional().nullable(),
  returnUrl: z.string().url().optional().nullable(),
  cancelUrl: z.string().url().optional().nullable(),
  callbackUrl: z.string().url().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  failedAt: z.string().optional().nullable(),
  cancelledAt: z.string().optional().nullable(),
  expiredAt: z.string().optional().nullable(),
  failureCode: z.string().max(255).optional().nullable(),
  failureMessage: z.string().max(2000).optional().nullable(),
  notes: z.string().optional().nullable(),
  providerPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const insertPaymentSessionSchema = paymentSessionCoreSchema
export const updatePaymentSessionSchema = paymentSessionCoreSchema.partial()
export const paymentSessionListQuerySchema = paginationSchema.extend({
  bookingId: z.string().optional(),
  orderId: z.string().optional(),
  invoiceId: z.string().optional(),
  bookingPaymentScheduleId: z.string().optional(),
  bookingGuaranteeId: z.string().optional(),
  targetType: paymentSessionTargetTypeSchema.optional(),
  status: paymentSessionStatusSchema.optional(),
  provider: z.string().optional(),
  providerSessionId: z.string().optional(),
  providerPaymentId: z.string().optional(),
  externalReference: z.string().optional(),
  clientReference: z.string().optional(),
  idempotencyKey: z.string().optional(),
})

const paymentSessionProvisioningSchema = z.object({
  provider: z.string().max(255).optional().nullable(),
  paymentMethod: paymentMethodSchema.optional().nullable(),
  payerPersonId: z.string().optional().nullable(),
  payerOrganizationId: z.string().optional().nullable(),
  payerEmail: z.string().email().optional().nullable(),
  payerName: z.string().max(255).optional().nullable(),
  externalReference: z.string().max(255).optional().nullable(),
  idempotencyKey: z.string().max(255).optional().nullable(),
  clientReference: z.string().max(255).optional().nullable(),
  returnUrl: z.string().url().optional().nullable(),
  cancelUrl: z.string().url().optional().nullable(),
  callbackUrl: z.string().url().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  providerPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const createPaymentSessionFromScheduleSchema = paymentSessionProvisioningSchema
export const createPaymentSessionFromGuaranteeSchema = paymentSessionProvisioningSchema
export const createPaymentSessionFromInvoiceSchema = paymentSessionProvisioningSchema

export const applyDefaultBookingPaymentPlanSchema = z.object({
  depositMode: z.enum(["none", "percentage", "fixed_amount"]).default("percentage"),
  depositValue: z.number().int().min(0).default(30),
  depositDueDate: z.string().optional().nullable(),
  balanceDueDaysBeforeStart: z.number().int().min(0).default(30),
  clearExistingPending: z.boolean().default(true),
  createGuarantee: z.boolean().default(false),
  guaranteeType: guaranteeTypeSchema.default("deposit"),
  notes: z.string().optional().nullable(),
})

export const markPaymentSessionRequiresRedirectSchema = z.object({
  provider: z.string().max(255).optional().nullable(),
  providerSessionId: z.string().max(255).optional().nullable(),
  providerPaymentId: z.string().max(255).optional().nullable(),
  externalReference: z.string().max(255).optional().nullable(),
  redirectUrl: z.string().url(),
  returnUrl: z.string().url().optional().nullable(),
  cancelUrl: z.string().url().optional().nullable(),
  callbackUrl: z.string().url().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  providerPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const completePaymentSessionSchema = z.object({
  status: z.enum(["authorized", "paid"]).default("paid"),
  providerSessionId: z.string().max(255).optional().nullable(),
  providerPaymentId: z.string().max(255).optional().nullable(),
  externalReference: z.string().max(255).optional().nullable(),
  paymentMethod: paymentMethodSchema.optional().nullable(),
  paymentInstrumentId: z.string().optional().nullable(),
  captureMode: captureModeSchema.default("manual"),
  externalAuthorizationId: z.string().max(255).optional().nullable(),
  externalCaptureId: z.string().max(255).optional().nullable(),
  approvalCode: z.string().max(255).optional().nullable(),
  authorizedAt: z.string().optional().nullable(),
  capturedAt: z.string().optional().nullable(),
  settledAt: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  referenceNumber: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  providerPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const failPaymentSessionSchema = z.object({
  providerSessionId: z.string().max(255).optional().nullable(),
  providerPaymentId: z.string().max(255).optional().nullable(),
  externalReference: z.string().max(255).optional().nullable(),
  failureCode: z.string().max(255).optional().nullable(),
  failureMessage: z.string().max(2000).optional().nullable(),
  notes: z.string().optional().nullable(),
  providerPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const cancelPaymentSessionSchema = z.object({
  notes: z.string().optional().nullable(),
  providerPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  cancelledAt: z.string().optional().nullable(),
})

export const expirePaymentSessionSchema = z.object({
  notes: z.string().optional().nullable(),
  providerPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  expiredAt: z.string().optional().nullable(),
})

// ---------- payment authorizations ----------

const paymentAuthorizationCoreSchema = z.object({
  bookingId: z.string().optional().nullable(),
  orderId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  bookingGuaranteeId: z.string().optional().nullable(),
  paymentInstrumentId: z.string().optional().nullable(),
  status: paymentAuthorizationStatusSchema.default("pending"),
  captureMode: captureModeSchema.default("manual"),
  currency: z.string().min(3).max(3),
  amountCents: z.number().int().min(0),
  provider: z.string().max(255).optional().nullable(),
  externalAuthorizationId: z.string().max(255).optional().nullable(),
  approvalCode: z.string().max(255).optional().nullable(),
  authorizedAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  voidedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const insertPaymentAuthorizationSchema = paymentAuthorizationCoreSchema
export const updatePaymentAuthorizationSchema = paymentAuthorizationCoreSchema.partial()
export const paymentAuthorizationListQuerySchema = paginationSchema.extend({
  bookingId: z.string().optional(),
  orderId: z.string().optional(),
  invoiceId: z.string().optional(),
  bookingGuaranteeId: z.string().optional(),
  paymentInstrumentId: z.string().optional(),
  status: paymentAuthorizationStatusSchema.optional(),
})

// ---------- payment captures ----------

const paymentCaptureCoreSchema = z.object({
  paymentAuthorizationId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  status: paymentCaptureStatusSchema.default("pending"),
  currency: z.string().min(3).max(3),
  amountCents: z.number().int().min(0),
  provider: z.string().max(255).optional().nullable(),
  externalCaptureId: z.string().max(255).optional().nullable(),
  capturedAt: z.string().optional().nullable(),
  settledAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const insertPaymentCaptureSchema = paymentCaptureCoreSchema
export const updatePaymentCaptureSchema = paymentCaptureCoreSchema.partial()
export const paymentCaptureListQuerySchema = paginationSchema.extend({
  paymentAuthorizationId: z.string().optional(),
  invoiceId: z.string().optional(),
  status: paymentCaptureStatusSchema.optional(),
})

// ---------- booking payment schedules ----------

const bookingPaymentScheduleCoreSchema = z.object({
  bookingItemId: z.string().optional().nullable(),
  scheduleType: paymentScheduleTypeSchema.default("balance"),
  status: paymentScheduleStatusSchema.default("pending"),
  dueDate: z.string().min(1),
  currency: z.string().min(3).max(3),
  amountCents: z.number().int().min(0),
  notes: z.string().optional().nullable(),
})

export const insertBookingPaymentScheduleSchema = bookingPaymentScheduleCoreSchema
export const updateBookingPaymentScheduleSchema = bookingPaymentScheduleCoreSchema.partial()

// ---------- booking guarantees ----------

const bookingGuaranteeCoreSchema = z.object({
  bookingPaymentScheduleId: z.string().optional().nullable(),
  bookingItemId: z.string().optional().nullable(),
  guaranteeType: guaranteeTypeSchema,
  status: guaranteeStatusSchema.default("pending"),
  paymentInstrumentId: z.string().optional().nullable(),
  paymentAuthorizationId: z.string().optional().nullable(),
  currency: z.string().min(3).max(3).optional().nullable(),
  amountCents: z.number().int().min(0).optional().nullable(),
  provider: z.string().max(255).optional().nullable(),
  referenceNumber: z.string().max(255).optional().nullable(),
  guaranteedAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  releasedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const insertBookingGuaranteeSchema = bookingGuaranteeCoreSchema
export const updateBookingGuaranteeSchema = bookingGuaranteeCoreSchema.partial()

// ---------- booking item tax lines ----------

const bookingItemTaxLineCoreSchema = z.object({
  code: z.string().max(100).optional().nullable(),
  name: z.string().min(1).max(255),
  jurisdiction: z.string().max(255).optional().nullable(),
  scope: taxScopeSchema.default("excluded"),
  currency: z.string().min(3).max(3),
  amountCents: z.number().int(),
  rateBasisPoints: z.number().int().min(0).optional().nullable(),
  includedInPrice: z.boolean().default(false),
  remittanceParty: z.string().max(255).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
})

export const insertBookingItemTaxLineSchema = bookingItemTaxLineCoreSchema
export const updateBookingItemTaxLineSchema = bookingItemTaxLineCoreSchema.partial()

// ---------- booking item commissions ----------

const bookingItemCommissionCoreSchema = z.object({
  channelId: z.string().optional().nullable(),
  recipientType: commissionRecipientTypeSchema,
  commissionModel: commissionModelSchema.default("percentage"),
  currency: z.string().min(3).max(3).optional().nullable(),
  amountCents: z.number().int().optional().nullable(),
  rateBasisPoints: z.number().int().min(0).optional().nullable(),
  status: commissionStatusSchema.default("pending"),
  payableAt: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const insertBookingItemCommissionSchema = bookingItemCommissionCoreSchema
export const updateBookingItemCommissionSchema = bookingItemCommissionCoreSchema.partial()

// ---------- invoices ----------

const invoiceCoreSchema = z.object({
  invoiceNumber: z.string().min(1).max(50),
  bookingId: z.string().min(1),
  personId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  status: invoiceStatusSchema.default("draft"),
  currency: z.string().min(3).max(3),
  baseCurrency: z.string().min(3).max(3).optional().nullable(),
  fxRateSetId: z.string().optional().nullable(),
  subtotalCents: z.number().int().min(0).default(0),
  baseSubtotalCents: z.number().int().min(0).optional().nullable(),
  taxCents: z.number().int().min(0).default(0),
  baseTaxCents: z.number().int().min(0).optional().nullable(),
  totalCents: z.number().int().min(0).default(0),
  baseTotalCents: z.number().int().min(0).optional().nullable(),
  paidCents: z.number().int().min(0).default(0),
  basePaidCents: z.number().int().min(0).optional().nullable(),
  balanceDueCents: z.number().int().min(0).default(0),
  baseBalanceDueCents: z.number().int().min(0).optional().nullable(),
  commissionPercent: z.number().int().min(0).max(100).optional().nullable(),
  commissionAmountCents: z.number().int().min(0).optional().nullable(),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  notes: z.string().optional().nullable(),
})

export const insertInvoiceSchema = invoiceCoreSchema
export const updateInvoiceSchema = invoiceCoreSchema.partial()

export const invoiceListQuerySchema = z.object({
  status: invoiceStatusSchema.optional(),
  bookingId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const invoiceFromBookingSchema = z.object({
  bookingId: z.string().min(1),
  invoiceNumber: z.string().min(1).max(50),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  notes: z.string().optional().nullable(),
})

// ---------- invoice line items ----------

const lineItemCoreSchema = z.object({
  bookingItemId: z.string().optional().nullable(),
  description: z.string().min(1).max(1000),
  quantity: z.number().int().min(1).default(1),
  unitPriceCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  taxRate: z.number().int().min(0).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
})

export const insertInvoiceLineItemSchema = lineItemCoreSchema
export const updateInvoiceLineItemSchema = lineItemCoreSchema.partial()

// ---------- payments ----------

const paymentCoreSchema = z.object({
  amountCents: z.number().int().min(1),
  currency: z.string().min(3).max(3),
  baseCurrency: z.string().min(3).max(3).optional().nullable(),
  baseAmountCents: z.number().int().min(0).optional().nullable(),
  fxRateSetId: z.string().optional().nullable(),
  paymentMethod: paymentMethodSchema,
  paymentInstrumentId: z.string().optional().nullable(),
  paymentAuthorizationId: z.string().optional().nullable(),
  paymentCaptureId: z.string().optional().nullable(),
  status: paymentStatusSchema.default("pending"),
  referenceNumber: z.string().max(255).optional().nullable(),
  paymentDate: z.string().min(1),
  notes: z.string().optional().nullable(),
})

export const insertPaymentSchema = paymentCoreSchema
export const updatePaymentSchema = paymentCoreSchema.partial()

// ---------- credit notes ----------

const creditNoteCoreSchema = z.object({
  creditNoteNumber: z.string().min(1).max(50),
  status: creditNoteStatusSchema.default("draft"),
  amountCents: z.number().int().min(1),
  currency: z.string().min(3).max(3),
  baseCurrency: z.string().min(3).max(3).optional().nullable(),
  baseAmountCents: z.number().int().min(0).optional().nullable(),
  fxRateSetId: z.string().optional().nullable(),
  reason: z.string().min(1).max(1000),
  notes: z.string().optional().nullable(),
})

export const insertCreditNoteSchema = creditNoteCoreSchema
export const updateCreditNoteSchema = creditNoteCoreSchema.partial()

// ---------- credit note line items ----------

const creditNoteLineItemCoreSchema = z.object({
  description: z.string().min(1).max(1000),
  quantity: z.number().int().min(1).default(1),
  unitPriceCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  sortOrder: z.number().int().min(0).default(0),
})

export const insertCreditNoteLineItemSchema = creditNoteLineItemCoreSchema
export const updateCreditNoteLineItemSchema = creditNoteLineItemCoreSchema.partial()

// ---------- supplier payments ----------

const supplierPaymentCoreSchema = z.object({
  bookingId: z.string().min(1),
  supplierId: z.string().optional().nullable(),
  bookingSupplierStatusId: z.string().optional().nullable(),
  amountCents: z.number().int().min(1),
  currency: z.string().min(3).max(3),
  baseCurrency: z.string().min(3).max(3).optional().nullable(),
  baseAmountCents: z.number().int().min(0).optional().nullable(),
  fxRateSetId: z.string().optional().nullable(),
  paymentMethod: paymentMethodSchema,
  paymentInstrumentId: z.string().optional().nullable(),
  status: paymentStatusSchema.default("pending"),
  referenceNumber: z.string().max(255).optional().nullable(),
  paymentDate: z.string().min(1),
  notes: z.string().optional().nullable(),
})

export const insertSupplierPaymentSchema = supplierPaymentCoreSchema
export const updateSupplierPaymentSchema = supplierPaymentCoreSchema.partial()

export const supplierPaymentListQuerySchema = z.object({
  bookingId: z.string().optional(),
  supplierId: z.string().optional(),
  status: paymentStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// ---------- finance notes ----------

export const insertFinanceNoteSchema = z.object({
  content: z.string().min(1).max(10000),
})

// ---------- reports ----------

export const revenueReportQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
})

export const agingReportQuerySchema = z.object({
  asOf: z.string().optional(),
})

export const profitabilityQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
})

// ---------- invoice_number_series ----------

const invoiceNumberResetStrategySchema = z.enum(["never", "annual", "monthly"])
const invoiceNumberSeriesScopeSchema = z.enum(["invoice", "proforma", "credit_note"])

const invoiceNumberSeriesCoreSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  prefix: z.string().max(50).default(""),
  separator: z.string().max(10).default(""),
  padLength: z.number().int().min(0).max(20).default(4),
  currentSequence: z.number().int().min(0).default(0),
  resetStrategy: invoiceNumberResetStrategySchema.default("never"),
  resetAt: z.string().optional().nullable(),
  scope: invoiceNumberSeriesScopeSchema.default("invoice"),
  active: z.boolean().default(true),
})

export const insertInvoiceNumberSeriesSchema = invoiceNumberSeriesCoreSchema
export const updateInvoiceNumberSeriesSchema = invoiceNumberSeriesCoreSchema.partial()
export const invoiceNumberSeriesListQuerySchema = paginationSchema.extend({
  scope: invoiceNumberSeriesScopeSchema.optional(),
  active: z.coerce.boolean().optional(),
})
export const allocateInvoiceNumberInputSchema = z.object({
  seriesId: z.string().min(1),
})

// ---------- invoice_templates ----------

const invoiceTemplateBodyFormatSchema = z.enum(["html", "markdown", "lexical_json"])

const invoiceTemplateCoreSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  language: z.string().min(2).max(10).default("en"),
  jurisdiction: z.string().max(10).optional().nullable(),
  bodyFormat: invoiceTemplateBodyFormatSchema.default("html"),
  body: z.string().min(1),
  cssStyles: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const insertInvoiceTemplateSchema = invoiceTemplateCoreSchema
export const updateInvoiceTemplateSchema = invoiceTemplateCoreSchema.partial()
export const invoiceTemplateListQuerySchema = paginationSchema.extend({
  language: z.string().optional(),
  jurisdiction: z.string().optional(),
  active: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

// ---------- invoice_renditions ----------

const invoiceRenditionFormatSchema = z.enum(["html", "pdf", "xml", "json"])
const invoiceRenditionStatusSchema = z.enum(["pending", "ready", "failed", "stale"])

const invoiceRenditionCoreSchema = z.object({
  templateId: z.string().optional().nullable(),
  format: invoiceRenditionFormatSchema.default("pdf"),
  status: invoiceRenditionStatusSchema.default("pending"),
  storageKey: z.string().optional().nullable(),
  fileSize: z.number().int().min(0).optional().nullable(),
  checksum: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  generatedAt: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const insertInvoiceRenditionSchema = invoiceRenditionCoreSchema
export const updateInvoiceRenditionSchema = invoiceRenditionCoreSchema.partial()

// ---------- tax_regimes ----------

const taxRegimeCodeSchema = z.enum([
  "standard",
  "reduced",
  "exempt",
  "reverse_charge",
  "margin_scheme_art311",
  "zero_rated",
  "out_of_scope",
  "other",
])

const taxRegimeCoreSchema = z.object({
  code: taxRegimeCodeSchema,
  name: z.string().min(1).max(255),
  jurisdiction: z.string().max(10).optional().nullable(),
  ratePercent: z.number().int().min(0).max(10000).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  legalReference: z.string().max(500).optional().nullable(),
  active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const insertTaxRegimeSchema = taxRegimeCoreSchema
export const updateTaxRegimeSchema = taxRegimeCoreSchema.partial()
export const taxRegimeListQuerySchema = paginationSchema.extend({
  code: taxRegimeCodeSchema.optional(),
  jurisdiction: z.string().optional(),
  active: z.coerce.boolean().optional(),
})

// ---------- invoice_external_refs ----------

const invoiceExternalRefCoreSchema = z.object({
  provider: z.string().min(1).max(100),
  externalId: z.string().max(255).optional().nullable(),
  externalNumber: z.string().max(255).optional().nullable(),
  externalUrl: z.string().max(1000).optional().nullable(),
  status: z.string().max(100).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  syncedAt: z.string().optional().nullable(),
  syncError: z.string().optional().nullable(),
})

export const insertInvoiceExternalRefSchema = invoiceExternalRefCoreSchema
export const updateInvoiceExternalRefSchema = invoiceExternalRefCoreSchema.partial()

// ---------- render invoice input ----------

export const renderInvoiceInputSchema = z.object({
  templateId: z.string().optional().nullable(),
  format: invoiceRenditionFormatSchema.default("pdf"),
  language: z.string().optional().nullable(),
})
