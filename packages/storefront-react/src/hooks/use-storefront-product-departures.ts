"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantStorefrontContext } from "../provider.js"
import {
  getStorefrontProductDeparturesQueryOptions,
  type StorefrontDepartureFilters,
} from "../query-options.js"

export interface UseStorefrontProductDeparturesOptions extends StorefrontDepartureFilters {
  enabled?: boolean
}

export function useStorefrontProductDepartures(
  productId: string | null | undefined,
  options: UseStorefrontProductDeparturesOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantStorefrontContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getStorefrontProductDeparturesQueryOptions({ baseUrl, fetcher }, productId ?? "", filters),
    enabled: enabled && Boolean(productId),
  })
}
