"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantStorefrontContext } from "../provider.js"
import {
  getStorefrontProductExtensionsQueryOptions,
  type StorefrontExtensionsFilters,
} from "../query-options.js"

export interface UseStorefrontProductExtensionsOptions extends StorefrontExtensionsFilters {
  enabled?: boolean
}

export function useStorefrontProductExtensions(
  productId: string | null | undefined,
  options: UseStorefrontProductExtensionsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantStorefrontContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getStorefrontProductExtensionsQueryOptions({ baseUrl, fetcher }, productId ?? "", filters),
    enabled: enabled && Boolean(productId),
  })
}
