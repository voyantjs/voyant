"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getInvoicePaymentsQueryOptions } from "../query-options.js"

export interface UseInvoicePaymentsOptions {
  enabled?: boolean
}

export function useInvoicePayments(
  invoiceId: string | null | undefined,
  options: UseInvoicePaymentsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getInvoicePaymentsQueryOptions({ baseUrl, fetcher }, invoiceId),
    enabled: enabled && Boolean(invoiceId),
  })
}
