"use client"

import { useQuery } from "@tanstack/react-query"
import { useVoyantLegalContext } from "../provider.js"
import type { LegalPolicyAssignmentsListFilters } from "../query-keys.js"
import { getLegalPolicyAssignmentsQueryOptions } from "../query-options.js"

export interface UseLegalPolicyAssignmentsOptions extends LegalPolicyAssignmentsListFilters {
  enabled?: boolean
}

export function useLegalPolicyAssignments(options: UseLegalPolicyAssignmentsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getLegalPolicyAssignmentsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
