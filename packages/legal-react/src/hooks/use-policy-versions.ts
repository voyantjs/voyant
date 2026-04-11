"use client"

import { useQuery } from "@tanstack/react-query"
import { useVoyantLegalContext } from "../provider.js"
import { getLegalPolicyVersionsQueryOptions } from "../query-options.js"

export interface UseLegalPolicyVersionsOptions {
  policyId: string
  enabled?: boolean
}

export function useLegalPolicyVersions(options: UseLegalPolicyVersionsOptions) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getLegalPolicyVersionsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
