"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantFinanceContext } from "../provider.js"
import { financeQueryKeys } from "../query-keys.js"
import { type InvoiceRecord, invoiceSingleResponse, successEnvelope } from "../schemas.js"

export interface CreateInvoiceInput {
  invoiceNumber: string
  bookingId: string
  personId?: string | null
  organizationId?: string | null
  status?: InvoiceRecord["status"]
  currency: string
  subtotalCents?: number
  taxCents?: number
  totalCents?: number
  paidCents?: number
  balanceDueCents?: number
  issueDate: string
  dueDate: string
  notes?: string | null
}

export type UpdateInvoiceInput = Partial<CreateInvoiceInput>

export function useInvoiceMutation() {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const { data } = await fetchWithValidation(
        "/v1/finance/invoices",
        invoiceSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.invoices() })
      queryClient.setQueryData(financeQueryKeys.invoice(data.id), { data })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateInvoiceInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/finance/invoices/${id}`,
        invoiceSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.invoices() })
      queryClient.setQueryData(financeQueryKeys.invoice(data.id), { data })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/finance/invoices/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        {
          method: "DELETE",
        },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.invoices() })
      queryClient.removeQueries({ queryKey: financeQueryKeys.invoice(id) })
      queryClient.removeQueries({ queryKey: financeQueryKeys.lineItems(id) })
      queryClient.removeQueries({ queryKey: financeQueryKeys.payments(id) })
      queryClient.removeQueries({ queryKey: financeQueryKeys.creditNotes(id) })
      queryClient.removeQueries({ queryKey: financeQueryKeys.notes(id) })
    },
  })

  return { create, update, remove }
}
