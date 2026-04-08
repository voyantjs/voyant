"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantContext } from "../provider.js"
import { crmQueryKeys, type QuotesListFilters } from "../query-keys.js"
import { quoteListResponse } from "../schemas.js"

export interface UseQuotesOptions extends QuotesListFilters {
  enabled?: boolean
}

export function useQuotes(options: UseQuotesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    queryKey: crmQueryKeys.quotesList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.opportunityId) params.set("opportunityId", filters.opportunityId)
      if (filters.status) params.set("status", filters.status)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()
      return fetchWithValidation(`/v1/crm/quotes${qs ? `?${qs}` : ""}`, quoteListResponse, {
        baseUrl,
        fetcher,
      })
    },
    enabled,
  })
}
