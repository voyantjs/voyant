"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantContext } from "../provider.js"
import { crmQueryKeys } from "../query-keys.js"
import { opportunitySingleResponse } from "../schemas.js"

export interface UseOpportunityOptions {
  enabled?: boolean
}

export function useOpportunity(id: string | undefined, options: UseOpportunityOptions = {}) {
  const { baseUrl, fetcher } = useVoyantContext()
  const { enabled = true } = options

  return useQuery({
    queryKey: crmQueryKeys.opportunity(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("useOpportunity requires an id")
      const { data } = await fetchWithValidation(
        `/v1/crm/opportunities/${id}`,
        opportunitySingleResponse,
        { baseUrl, fetcher },
      )
      return data
    },
    enabled: enabled && Boolean(id),
  })
}
