"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantProductsContext } from "../provider.js"
import { type ProductTypesListFilters, productsQueryKeys } from "../query-keys.js"
import { productTypeListResponse } from "../schemas.js"

export interface UseProductTypesOptions extends ProductTypesListFilters {
  enabled?: boolean
}

export function useProductTypes(options: UseProductTypesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantProductsContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    queryKey: productsQueryKeys.productTypesList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.active !== undefined) params.set("active", String(filters.active))
      if (filters.search) params.set("search", filters.search)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()
      return fetchWithValidation(
        `/v1/products/product-types${qs ? `?${qs}` : ""}`,
        productTypeListResponse,
        { baseUrl, fetcher },
      )
    },
    enabled,
  })
}
