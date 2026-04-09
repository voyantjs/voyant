"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantPricingContext } from "../provider.js"
import { pricingQueryKeys } from "../query-keys.js"
import { pricingCategorySingleResponse } from "../schemas.js"

export interface UsePricingCategoryOptions {
  enabled?: boolean
}

export function usePricingCategory(
  id: string | null | undefined,
  options: UsePricingCategoryOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantPricingContext()
  const { enabled = true } = options

  return useQuery({
    queryKey: pricingQueryKeys.pricingCategory(id ?? "__missing__"),
    queryFn: async () => {
      const { data } = await fetchWithValidation(
        `/v1/pricing/pricing-categories/${id}`,
        pricingCategorySingleResponse,
        { baseUrl, fetcher },
      )
      return data
    },
    enabled: enabled && Boolean(id),
  })
}
