"use client"

import { useQuery } from "@tanstack/react-query"
import { useVoyantLegalContext } from "../provider.js"
import type { LegalPolicyAcceptancesListFilters } from "../query-keys.js"
import { getLegalPolicyAcceptancesQueryOptions } from "../query-options.js"

export interface UseLegalPolicyAcceptancesOptions extends LegalPolicyAcceptancesListFilters {
  enabled?: boolean
}

export function useLegalPolicyAcceptances(options: UseLegalPolicyAcceptancesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getLegalPolicyAcceptancesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
