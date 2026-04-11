"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantTransactionsContext } from "../provider.js"
import type { OffersListFilters } from "../query-keys.js"
import { getOffersQueryOptions } from "../query-options.js"

export interface UseOffersOptions extends OffersListFilters {
  enabled?: boolean
}

export function useOffers(options: UseOffersOptions = {}) {
  const { baseUrl, fetcher } = useVoyantTransactionsContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getOffersQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
