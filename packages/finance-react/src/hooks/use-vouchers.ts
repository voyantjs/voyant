"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import type { FinanceVoucherListFilters } from "../query-keys.js"
import { getVouchersQueryOptions } from "../query-options.js"

export interface UseVouchersOptions extends FinanceVoucherListFilters {
  enabled?: boolean
}

/**
 * Admin voucher list. Filters by status, person/org assignment, free-text
 * search over code/notes, and `hasBalance` (remaining > 0). Use
 * `hasBalance: true` for the voucher picker in booking-create flows — a
 * voucher with zero balance is a historical record, not spendable credit.
 */
export function useVouchers(options: UseVouchersOptions = {}) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getVouchersQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
