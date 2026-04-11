"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getInvoiceQueryOptions } from "../query-options.js"

export interface UseInvoiceOptions {
  enabled?: boolean
}

export function useInvoice(id: string | null | undefined, options: UseInvoiceOptions = {}) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getInvoiceQueryOptions({ baseUrl, fetcher }, id),
    enabled: enabled && Boolean(id),
  })
}
