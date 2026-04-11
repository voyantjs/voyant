"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getInvoiceCreditNotesQueryOptions } from "../query-options.js"

export interface UseInvoiceCreditNotesOptions {
  enabled?: boolean
}

export function useInvoiceCreditNotes(
  invoiceId: string | null | undefined,
  options: UseInvoiceCreditNotesOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getInvoiceCreditNotesQueryOptions({ baseUrl, fetcher }, invoiceId),
    enabled: enabled && Boolean(invoiceId),
  })
}
