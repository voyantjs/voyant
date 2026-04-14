"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantStorefrontContext } from "../provider.js"
import {
  getStorefrontProductOffersQueryOptions,
  type StorefrontOfferFilters,
} from "../query-options.js"

export interface UseStorefrontProductOffersOptions extends StorefrontOfferFilters {
  enabled?: boolean
}

export function useStorefrontProductOffers(
  productId: string | null | undefined,
  options: UseStorefrontProductOffersOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantStorefrontContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getStorefrontProductOffersQueryOptions({ baseUrl, fetcher }, productId ?? "", filters),
    enabled: enabled && Boolean(productId),
  })
}
