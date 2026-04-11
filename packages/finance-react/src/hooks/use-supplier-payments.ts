"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import type { FinanceSupplierPaymentListFilters } from "../query-keys.js"
import { getSupplierPaymentsQueryOptions } from "../query-options.js"

export interface UseSupplierPaymentsOptions extends FinanceSupplierPaymentListFilters {
  enabled?: boolean
}

export function useSupplierPayments(options: UseSupplierPaymentsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getSupplierPaymentsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
