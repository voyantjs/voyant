"use client"

import { queryOptions } from "@tanstack/react-query"

import { type FetchWithValidationOptions, fetchWithValidation } from "./client.js"
import type { UseInvoiceOptions } from "./hooks/use-invoice.js"
import type { UseInvoiceCreditNotesOptions } from "./hooks/use-invoice-credit-notes.js"
import type { UseInvoiceLineItemsOptions } from "./hooks/use-invoice-line-items.js"
import type { UseInvoiceNotesOptions } from "./hooks/use-invoice-notes.js"
import type { UseInvoicePaymentsOptions } from "./hooks/use-invoice-payments.js"
import type { UseInvoicesOptions } from "./hooks/use-invoices.js"
import type { UsePublicBookingDocumentsOptions } from "./hooks/use-public-booking-documents.js"
import type { UsePublicBookingPaymentOptionsOptions } from "./hooks/use-public-booking-payment-options.js"
import type { UsePublicPaymentSessionOptions } from "./hooks/use-public-payment-session.js"
import type { UseSupplierPaymentsOptions } from "./hooks/use-supplier-payments.js"
import {
  getPublicBookingDocuments,
  getPublicBookingPaymentOptions,
  getPublicPaymentSession,
} from "./operations.js"
import { financeQueryKeys } from "./query-keys.js"
import {
  invoiceCreditNotesResponse,
  invoiceLineItemsResponse,
  invoiceListResponse,
  invoiceNotesResponse,
  invoicePaymentsResponse,
  invoiceSingleResponse,
  supplierPaymentListResponse,
} from "./schemas.js"

export function getInvoicesQueryOptions(
  client: FetchWithValidationOptions,
  options: UseInvoicesOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: financeQueryKeys.invoicesList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.search) params.set("search", filters.search)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()

      return fetchWithValidation(
        `/v1/finance/invoices${qs ? `?${qs}` : ""}`,
        invoiceListResponse,
        client,
      )
    },
  })
}

export function getSupplierPaymentsQueryOptions(
  client: FetchWithValidationOptions,
  options: UseSupplierPaymentsOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: financeQueryKeys.supplierPaymentsList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()

      return fetchWithValidation(
        `/v1/finance/supplier-payments${qs ? `?${qs}` : ""}`,
        supplierPaymentListResponse,
        client,
      )
    },
  })
}

export function getInvoiceQueryOptions(
  client: FetchWithValidationOptions,
  id: string | null | undefined,
  options: UseInvoiceOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: financeQueryKeys.invoice(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("getInvoiceQueryOptions requires an id")
      return fetchWithValidation(`/v1/finance/invoices/${id}`, invoiceSingleResponse, client)
    },
  })
}

export function getInvoiceLineItemsQueryOptions(
  client: FetchWithValidationOptions,
  invoiceId: string | null | undefined,
  options: UseInvoiceLineItemsOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: financeQueryKeys.lineItems(invoiceId ?? ""),
    queryFn: async () => {
      if (!invoiceId) throw new Error("getInvoiceLineItemsQueryOptions requires an invoiceId")
      return fetchWithValidation(
        `/v1/finance/invoices/${invoiceId}/line-items`,
        invoiceLineItemsResponse,
        client,
      )
    },
  })
}

export function getInvoicePaymentsQueryOptions(
  client: FetchWithValidationOptions,
  invoiceId: string | null | undefined,
  options: UseInvoicePaymentsOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: financeQueryKeys.payments(invoiceId ?? ""),
    queryFn: async () => {
      if (!invoiceId) throw new Error("getInvoicePaymentsQueryOptions requires an invoiceId")
      return fetchWithValidation(
        `/v1/finance/invoices/${invoiceId}/payments`,
        invoicePaymentsResponse,
        client,
      )
    },
  })
}

export function getInvoiceCreditNotesQueryOptions(
  client: FetchWithValidationOptions,
  invoiceId: string | null | undefined,
  options: UseInvoiceCreditNotesOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: financeQueryKeys.creditNotes(invoiceId ?? ""),
    queryFn: async () => {
      if (!invoiceId) throw new Error("getInvoiceCreditNotesQueryOptions requires an invoiceId")
      return fetchWithValidation(
        `/v1/finance/invoices/${invoiceId}/credit-notes`,
        invoiceCreditNotesResponse,
        client,
      )
    },
  })
}

export function getInvoiceNotesQueryOptions(
  client: FetchWithValidationOptions,
  invoiceId: string | null | undefined,
  options: UseInvoiceNotesOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: financeQueryKeys.notes(invoiceId ?? ""),
    queryFn: async () => {
      if (!invoiceId) throw new Error("getInvoiceNotesQueryOptions requires an invoiceId")
      return fetchWithValidation(
        `/v1/finance/invoices/${invoiceId}/notes`,
        invoiceNotesResponse,
        client,
      )
    },
  })
}

export function getPublicBookingPaymentOptionsQueryOptions(
  client: FetchWithValidationOptions,
  bookingId: string | null | undefined,
  options: UsePublicBookingPaymentOptionsOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: financeQueryKeys.publicBookingPaymentOptions(bookingId ?? "", filters),
    queryFn: async () => {
      if (!bookingId) {
        throw new Error("getPublicBookingPaymentOptionsQueryOptions requires a bookingId")
      }

      return getPublicBookingPaymentOptions(client, bookingId, filters)
    },
  })
}

export function getPublicBookingDocumentsQueryOptions(
  client: FetchWithValidationOptions,
  bookingId: string | null | undefined,
  options: UsePublicBookingDocumentsOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: financeQueryKeys.publicBookingDocuments(bookingId ?? ""),
    queryFn: async () => {
      if (!bookingId) {
        throw new Error("getPublicBookingDocumentsQueryOptions requires a bookingId")
      }

      return getPublicBookingDocuments(client, bookingId)
    },
  })
}

export function getPublicPaymentSessionQueryOptions(
  client: FetchWithValidationOptions,
  sessionId: string | null | undefined,
  options: UsePublicPaymentSessionOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: financeQueryKeys.publicPaymentSession(sessionId ?? ""),
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("getPublicPaymentSessionQueryOptions requires a sessionId")
      }

      return getPublicPaymentSession(client, sessionId)
    },
  })
}
