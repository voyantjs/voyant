"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getPublicFinanceDocumentByReferenceQueryOptions } from "../query-options.js"

export interface UsePublicFinanceDocumentByReferenceOptions {
  enabled?: boolean
}

export function usePublicFinanceDocumentByReference(
  reference: string | null | undefined,
  options: UsePublicFinanceDocumentByReferenceOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getPublicFinanceDocumentByReferenceQueryOptions({ baseUrl, fetcher }, reference),
    enabled: enabled && Boolean(reference),
  })
}
