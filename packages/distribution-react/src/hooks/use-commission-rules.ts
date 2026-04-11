"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantDistributionContext } from "../provider.js"
import type { CommissionRulesListFilters } from "../query-keys.js"
import { getCommissionRulesQueryOptions } from "../query-options.js"

export interface UseCommissionRulesOptions extends CommissionRulesListFilters {
  enabled?: boolean
}

export function useCommissionRules(options: UseCommissionRulesOptions = {}) {
  const client = useVoyantDistributionContext()
  const { enabled = true } = options
  return useQuery({ ...getCommissionRulesQueryOptions(client, options), enabled })
}
