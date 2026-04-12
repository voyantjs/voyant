import {
  publicBookingPaymentOptionsSchema,
  publicPaymentOptionsQuerySchema,
  publicPaymentSessionSchema,
  publicStartPaymentSessionSchema,
  publicValidateVoucherSchema,
  publicVoucherValidationSchema,
} from "@voyantjs/finance"
import { z } from "zod"

export const paginatedEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })

export const singleEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: item })
export const arrayEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: z.array(item) })
export const successEnvelope = z.object({ success: z.boolean() })

export const invoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "void",
])

export const paymentStatusSchema = z.enum(["pending", "completed", "failed", "refunded"])
export const creditNoteStatusSchema = z.enum(["draft", "issued", "applied"])

export const invoiceRecordSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  bookingId: z.string(),
  personId: z.string().nullable(),
  organizationId: z.string().nullable(),
  status: invoiceStatusSchema,
  currency: z.string(),
  subtotalCents: z.number().int(),
  taxCents: z.number().int(),
  totalCents: z.number().int(),
  paidCents: z.number().int(),
  balanceDueCents: z.number().int(),
  issueDate: z.string(),
  dueDate: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type InvoiceRecord = z.infer<typeof invoiceRecordSchema>

export const lineItemRecordSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  description: z.string(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int(),
  totalCents: z.number().int(),
  taxRate: z.number().int().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
})

export type LineItemRecord = z.infer<typeof lineItemRecordSchema>

export const paymentRecordSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  amountCents: z.number().int(),
  currency: z.string(),
  paymentMethod: z.string(),
  status: paymentStatusSchema,
  referenceNumber: z.string().nullable(),
  paymentDate: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
})

export type PaymentRecord = z.infer<typeof paymentRecordSchema>

export const creditNoteRecordSchema = z.object({
  id: z.string(),
  creditNoteNumber: z.string(),
  invoiceId: z.string(),
  status: creditNoteStatusSchema,
  amountCents: z.number().int(),
  currency: z.string(),
  reason: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
})

export type CreditNoteRecord = z.infer<typeof creditNoteRecordSchema>

export const financeNoteRecordSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  authorId: z.string(),
  content: z.string(),
  createdAt: z.string(),
})

export type FinanceNoteRecord = z.infer<typeof financeNoteRecordSchema>

export const supplierPaymentRecordSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  supplierId: z.string().nullable(),
  amountCents: z.number().int(),
  currency: z.string(),
  paymentMethod: z.string(),
  status: paymentStatusSchema,
  referenceNumber: z.string().nullable(),
  paymentDate: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
})

export type SupplierPaymentRecord = z.infer<typeof supplierPaymentRecordSchema>

export const invoiceListResponse = paginatedEnvelope(invoiceRecordSchema)
export const supplierPaymentListResponse = paginatedEnvelope(supplierPaymentRecordSchema)
export const invoiceSingleResponse = singleEnvelope(invoiceRecordSchema)
export const invoiceLineItemsResponse = arrayEnvelope(lineItemRecordSchema)
export const invoicePaymentsResponse = arrayEnvelope(paymentRecordSchema)
export const invoiceCreditNotesResponse = arrayEnvelope(creditNoteRecordSchema)
export const invoiceNotesResponse = arrayEnvelope(financeNoteRecordSchema)

export {
  publicBookingPaymentOptionsSchema,
  publicPaymentOptionsQuerySchema,
  publicPaymentSessionSchema,
  publicStartPaymentSessionSchema,
  publicValidateVoucherSchema,
  publicVoucherValidationSchema,
}

export const publicBookingPaymentOptionsResponse = singleEnvelope(publicBookingPaymentOptionsSchema)
export const publicPaymentSessionResponse = singleEnvelope(publicPaymentSessionSchema)
export const publicVoucherValidationResponse = singleEnvelope(publicVoucherValidationSchema)

export type PublicBookingPaymentOptionsRecord = z.infer<typeof publicBookingPaymentOptionsSchema>
export type PublicPaymentSessionRecord = z.infer<typeof publicPaymentSessionSchema>
export type PublicStartPaymentSessionInput = z.input<typeof publicStartPaymentSessionSchema>
export type PublicValidateVoucherInput = z.input<typeof publicValidateVoucherSchema>
export type PublicVoucherValidationRecord = z.infer<typeof publicVoucherValidationSchema>
