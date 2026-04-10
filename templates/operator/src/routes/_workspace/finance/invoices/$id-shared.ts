import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api-client"

export type InvoiceDetail = {
  id: string
  invoiceNumber: string
  bookingId: string
  personId: string | null
  organizationId: string | null
  status: "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "void"
  currency: string
  subtotalCents: number
  taxCents: number
  totalCents: number
  paidCents: number
  balanceDueCents: number
  issueDate: string
  dueDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type LineItem = {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPriceCents: number
  totalCents: number
  taxRate: number | null
  sortOrder: number
  createdAt: string
}

export type PaymentRow = {
  id: string
  invoiceId: string
  amountCents: number
  currency: string
  paymentMethod: string
  status: "pending" | "completed" | "failed" | "refunded"
  referenceNumber: string | null
  paymentDate: string
  notes: string | null
  createdAt: string
}

export type CreditNoteRow = {
  id: string
  creditNoteNumber: string
  invoiceId: string
  status: "draft" | "issued" | "applied"
  amountCents: number
  currency: string
  reason: string
  notes: string | null
  createdAt: string
}

export type FinanceNote = {
  id: string
  invoiceId: string
  authorId: string
  content: string
  createdAt: string
}

export function getInvoiceQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice", id],
    queryFn: () => api.get<{ data: InvoiceDetail }>(`/v1/finance/invoices/${id}`),
  })
}

export function getInvoiceLineItemsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice-line-items", id],
    queryFn: () => api.get<{ data: LineItem[] }>(`/v1/finance/invoices/${id}/line-items`),
  })
}

export function getInvoicePaymentsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice-payments", id],
    queryFn: () => api.get<{ data: PaymentRow[] }>(`/v1/finance/invoices/${id}/payments`),
  })
}

export function getInvoiceCreditNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice-credit-notes", id],
    queryFn: () => api.get<{ data: CreditNoteRow[] }>(`/v1/finance/invoices/${id}/credit-notes`),
  })
}

export function getInvoiceNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoice-notes", id],
    queryFn: () => api.get<{ data: FinanceNote[] }>(`/v1/finance/invoices/${id}/notes`),
  })
}

export const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  sent: "secondary",
  partially_paid: "secondary",
  paid: "default",
  overdue: "destructive",
  void: "destructive",
}

export const paymentStatusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  completed: "default",
  failed: "destructive",
  refunded: "secondary",
}

export const creditNoteStatusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  issued: "default",
  applied: "secondary",
}

export function formatAmount(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ")
}

export function formatMethod(method: string): string {
  return method.replace(/_/g, " ")
}
