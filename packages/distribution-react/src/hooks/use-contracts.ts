"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantDistributionContext } from "../provider.js"
import type { ContractsListFilters } from "../query-keys.js"
import { getContractsQueryOptions } from "../query-options.js"

export interface UseContractsOptions extends ContractsListFilters {
  enabled?: boolean
}

export function useContracts(options: UseContractsOptions = {}) {
  const client = useVoyantDistributionContext()
  const { enabled = true } = options
  return useQuery({ ...getContractsQueryOptions(client, options), enabled })
}
