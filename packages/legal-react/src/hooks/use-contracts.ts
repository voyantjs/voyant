"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantLegalContext } from "../provider.js"
import type { LegalContractsListFilters } from "../query-keys.js"
import { getLegalContractsQueryOptions } from "../query-options.js"

export interface UseLegalContractsOptions extends LegalContractsListFilters {
  enabled?: boolean
}

export function useLegalContracts(options: UseLegalContractsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getLegalContractsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
