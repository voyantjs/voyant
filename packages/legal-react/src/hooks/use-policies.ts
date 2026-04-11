"use client"

import { useQuery } from "@tanstack/react-query"
import { useVoyantLegalContext } from "../provider.js"
import type { LegalPoliciesListFilters } from "../query-keys.js"
import { getLegalPoliciesQueryOptions } from "../query-options.js"

export interface UseLegalPoliciesOptions extends LegalPoliciesListFilters {
  enabled?: boolean
}

export function useLegalPolicies(options: UseLegalPoliciesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getLegalPoliciesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
