"use client"

import { useQuery } from "@tanstack/react-query"
import { useVoyantLegalContext } from "../provider.js"
import type { LegalContractNumberSeriesListFilters } from "../query-keys.js"
import { getLegalContractNumberSeriesQueryOptions } from "../query-options.js"

export interface UseLegalContractNumberSeriesOptions extends LegalContractNumberSeriesListFilters {
  enabled?: boolean
}

export function useLegalContractNumberSeries(options: UseLegalContractNumberSeriesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getLegalContractNumberSeriesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
