"use client"

import { queryOptions } from "@tanstack/react-query"

import { type FetchWithValidationOptions, fetchWithValidation } from "./client.js"
import type { UseProductOptions } from "./hooks/use-product.js"
import type { UseProductCategoriesOptions } from "./hooks/use-product-categories.js"
import type { UseProductTagsOptions } from "./hooks/use-product-tags.js"
import type { UseProductsOptions } from "./hooks/use-products.js"
import { productsQueryKeys } from "./query-keys.js"
import {
  productCategoryListResponse,
  productListResponse,
  productSingleResponse,
  productTagListResponse,
} from "./schemas.js"

export function getProductsQueryOptions(
  client: FetchWithValidationOptions,
  options: UseProductsOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: productsQueryKeys.productsList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.bookingMode) params.set("bookingMode", filters.bookingMode)
      if (filters.visibility) params.set("visibility", filters.visibility)
      if (filters.activated !== undefined) params.set("activated", String(filters.activated))
      if (filters.facilityId) params.set("facilityId", filters.facilityId)
      if (filters.search) params.set("search", filters.search)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()

      return fetchWithValidation(`/v1/products${qs ? `?${qs}` : ""}`, productListResponse, client)
    },
  })
}

export function getProductQueryOptions(
  client: FetchWithValidationOptions,
  id: string | null | undefined,
  options: UseProductOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: productsQueryKeys.product(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("getProductQueryOptions requires an id")

      const { data } = await fetchWithValidation(
        `/v1/products/${id}`,
        productSingleResponse,
        client,
      )
      return data
    },
  })
}

export function getProductTagsQueryOptions(
  client: FetchWithValidationOptions,
  options: UseProductTagsOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: productsQueryKeys.productTagsList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.search) params.set("search", filters.search)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()

      return fetchWithValidation(
        `/v1/products/product-tags${qs ? `?${qs}` : ""}`,
        productTagListResponse,
        client,
      )
    },
  })
}

export function getProductCategoriesQueryOptions(
  client: FetchWithValidationOptions,
  options: UseProductCategoriesOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: productsQueryKeys.productCategoriesList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.parentId) params.set("parentId", filters.parentId)
      if (filters.active !== undefined) params.set("active", String(filters.active))
      if (filters.search) params.set("search", filters.search)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()

      return fetchWithValidation(
        `/v1/products/product-categories${qs ? `?${qs}` : ""}`,
        productCategoryListResponse,
        client,
      )
    },
  })
}
