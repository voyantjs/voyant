"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import type { FinanceInvoiceListFilters } from "../query-keys.js"
import { getInvoicesQueryOptions } from "../query-options.js"

export interface UseInvoicesOptions extends FinanceInvoiceListFilters {
  enabled?: boolean
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getInvoicesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
