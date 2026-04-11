"use client"

import { useQuery } from "@tanstack/react-query"
import { useVoyantLegalContext } from "../provider.js"
import { getLegalPolicyQueryOptions } from "../query-options.js"

export interface UseLegalPolicyOptions {
  enabled?: boolean
}

export function useLegalPolicy(id: string, options: UseLegalPolicyOptions = {}) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true } = options
  return useQuery({
    ...getLegalPolicyQueryOptions({ baseUrl, fetcher }, id),
    enabled,
  })
}
