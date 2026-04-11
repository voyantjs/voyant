"use client"

import { useQuery } from "@tanstack/react-query"
import { useVoyantLegalContext } from "../provider.js"
import { getLegalPolicyRulesQueryOptions } from "../query-options.js"

export interface UseLegalPolicyRulesOptions {
  versionId: string
  enabled?: boolean
}

export function useLegalPolicyRules(options: UseLegalPolicyRulesOptions) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getLegalPolicyRulesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
