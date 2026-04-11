"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getInvoiceLineItemsQueryOptions } from "../query-options.js"

export interface UseInvoiceLineItemsOptions {
  enabled?: boolean
}

export function useInvoiceLineItems(
  invoiceId: string | null | undefined,
  options: UseInvoiceLineItemsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getInvoiceLineItemsQueryOptions({ baseUrl, fetcher }, invoiceId),
    enabled: enabled && Boolean(invoiceId),
  })
}
