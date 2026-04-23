"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getVoucherQueryOptions } from "../query-options.js"

export interface UseVoucherOptions {
  enabled?: boolean
}

/**
 * Single voucher + redemption history. The response envelope attaches the
 * full `redemptions[]` list so the operator detail view can render the audit
 * trail in one request.
 */
export function useVoucher(id: string | null | undefined, options: UseVoucherOptions = {}) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getVoucherQueryOptions({ baseUrl, fetcher }, id),
    enabled: enabled && Boolean(id),
  })
}
