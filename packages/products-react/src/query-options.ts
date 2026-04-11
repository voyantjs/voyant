"use client"

import { queryOptions } from "@tanstack/react-query"

import { type FetchWithValidationOptions, fetchWithValidation } from "./client.js"
import type { UseOptionUnitOptions } from "./hooks/use-option-unit.js"
import type { UseOptionUnitsOptions } from "./hooks/use-option-units.js"
import type { UseProductOptions } from "./hooks/use-product.js"
import type { UseProductCategoriesOptions } from "./hooks/use-product-categories.js"
import type { UseProductOptionOptions } from "./hooks/use-product-option.js"
import type { UseProductOptionsListOptions } from "./hooks/use-product-options.js"
import type { UseProductTagsOptions } from "./hooks/use-product-tags.js"
import type { UseProductTypesOptions } from "./hooks/use-product-types.js"
import type { UseProductsOptions } from "./hooks/use-products.js"
import { productsQueryKeys } from "./query-keys.js"
import {
  optionUnitListResponse,
  optionUnitSingleResponse,
  productCategoryListResponse,
  productListResponse,
  productOptionListResponse,
  productOptionSingleResponse,
  productSingleResponse,
  productTagListResponse,
  productTypeListResponse,
  productTypeSingleResponse,
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

export function getProductTypesQueryOptions(
  client: FetchWithValidationOptions,
  options: UseProductTypesOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
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
        client,
      )
    },
  })
}

export function getProductTypeQueryOptions(
  client: FetchWithValidationOptions,
  id: string | null | undefined,
) {
  return queryOptions({
    queryKey: productsQueryKeys.productType(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("getProductTypeQueryOptions requires an id")

      const { data } = await fetchWithValidation(
        `/v1/products/product-types/${id}`,
        productTypeSingleResponse,
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

export function getProductOptionsQueryOptions(
  client: FetchWithValidationOptions,
  options: UseProductOptionsListOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: productsQueryKeys.productOptionsList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.productId) params.set("productId", filters.productId)
      if (filters.status) params.set("status", filters.status)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()

      return fetchWithValidation(
        `/v1/products/options${qs ? `?${qs}` : ""}`,
        productOptionListResponse,
        client,
      )
    },
  })
}

export function getProductOptionQueryOptions(
  client: FetchWithValidationOptions,
  id: string | null | undefined,
  options: UseProductOptionOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: productsQueryKeys.productOption(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("getProductOptionQueryOptions requires an id")

      const { data } = await fetchWithValidation(
        `/v1/products/options/${id}`,
        productOptionSingleResponse,
        client,
      )
      return data
    },
  })
}

export function getOptionUnitsQueryOptions(
  client: FetchWithValidationOptions,
  options: UseOptionUnitsOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: productsQueryKeys.optionUnitsList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.optionId) params.set("optionId", filters.optionId)
      if (filters.unitType) params.set("unitType", filters.unitType)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()

      return fetchWithValidation(
        `/v1/products/units${qs ? `?${qs}` : ""}`,
        optionUnitListResponse,
        client,
      )
    },
  })
}

export function getOptionUnitQueryOptions(
  client: FetchWithValidationOptions,
  id: string | null | undefined,
  options: UseOptionUnitOptions = {},
) {
  const { enabled: _enabled = true } = options

  return queryOptions({
    queryKey: productsQueryKeys.optionUnit(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("getOptionUnitQueryOptions requires an id")

      const { data } = await fetchWithValidation(
        `/v1/products/units/${id}`,
        optionUnitSingleResponse,
        client,
      )
      return data
    },
  })
}
