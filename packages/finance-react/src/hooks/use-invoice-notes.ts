"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getInvoiceNotesQueryOptions } from "../query-options.js"

export interface UseInvoiceNotesOptions {
  enabled?: boolean
}

export function useInvoiceNotes(
  invoiceId: string | null | undefined,
  options: UseInvoiceNotesOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getInvoiceNotesQueryOptions({ baseUrl, fetcher }, invoiceId),
    enabled: enabled && Boolean(invoiceId),
  })
}
