"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantContext } from "../provider.js"
import { crmQueryKeys } from "../query-keys.js"
import { organizationSingleResponse } from "../schemas.js"

export interface UseOrganizationOptions {
  enabled?: boolean
}

export function useOrganization(id: string | undefined, options: UseOrganizationOptions = {}) {
  const { baseUrl, fetcher } = useVoyantContext()
  const { enabled = true } = options

  return useQuery({
    queryKey: crmQueryKeys.organization(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("useOrganization requires an id")
      const { data } = await fetchWithValidation(
        `/v1/crm/organizations/${id}`,
        organizationSingleResponse,
        { baseUrl, fetcher },
      )
      return data
    },
    enabled: enabled && Boolean(id),
  })
}
