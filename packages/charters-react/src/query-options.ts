/**
 * TanStack `queryOptions()` factories for the charters module.
 *
 * Hooks under `./hooks/` wrap these so they can be used both inside React
 * components and outside (SSR loaders, route preloads, framework adapters).
 * Each factory takes a `FetchWithValidationOptions` instead of reading from
 * context — the hook provides that, but a server loader can pass it in
 * directly.
 */

import { queryOptions } from "@tanstack/react-query"

import { type FetchWithValidationOptions, fetchWithValidation } from "./client.js"
import {
  chartersQueryKeys,
  type ProductsListFilters,
  type PublicProductsListFilters,
  type VoyagesListFilters,
  type YachtsListFilters,
} from "./query-keys.js"
import {
  adminProductListResponse,
  productDetailResponse,
  productListResponse,
  voyageDetailResponse,
  voyageListResponse,
  yachtDetailResponse,
  yachtListResponse,
} from "./schemas.js"

// ---------- helpers ----------

function buildQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue
    search.set(k, String(v))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

// ---------- products ----------

export function getProductsQueryOptions(
  client: FetchWithValidationOptions,
  filters: ProductsListFilters = {},
) {
  return queryOptions({
    queryKey: chartersQueryKeys.productsList(filters),
    queryFn: () =>
      fetchWithValidation(
        `/v1/admin/charters/products${buildQueryString(filters as Record<string, unknown>)}`,
        adminProductListResponse,
        client,
      ),
  })
}

export function getProductQueryOptions(
  client: FetchWithValidationOptions,
  key: string,
  options: { include?: ReadonlyArray<"voyages" | "yacht"> } = {},
) {
  const include = options.include ?? []
  const qs = include.length > 0 ? `?include=${include.join(",")}` : ""
  return queryOptions({
    queryKey: chartersQueryKeys.product(key, include),
    queryFn: async () => {
      const result = await fetchWithValidation(
        `/v1/admin/charters/products/${encodeURIComponent(key)}${qs}`,
        productDetailResponse,
        client,
      )
      return result.data
    },
  })
}

// ---------- voyages ----------

export function getVoyagesQueryOptions(
  client: FetchWithValidationOptions,
  filters: VoyagesListFilters = {},
) {
  return queryOptions({
    queryKey: chartersQueryKeys.voyagesList(filters),
    queryFn: () =>
      fetchWithValidation(
        `/v1/admin/charters/voyages${buildQueryString(filters as Record<string, unknown>)}`,
        voyageListResponse,
        client,
      ),
  })
}

export function getVoyageQueryOptions(
  client: FetchWithValidationOptions,
  key: string,
  options: { include?: ReadonlyArray<"suites" | "schedule"> } = {},
) {
  const include = options.include ?? []
  const qs = include.length > 0 ? `?include=${include.join(",")}` : ""
  return queryOptions({
    queryKey: chartersQueryKeys.voyage(key, include),
    queryFn: async () => {
      const result = await fetchWithValidation(
        `/v1/admin/charters/voyages/${encodeURIComponent(key)}${qs}`,
        voyageDetailResponse,
        client,
      )
      return result.data
    },
  })
}

// ---------- yachts ----------

export function getYachtsQueryOptions(
  client: FetchWithValidationOptions,
  filters: YachtsListFilters = {},
) {
  return queryOptions({
    queryKey: chartersQueryKeys.yachtsList(filters),
    queryFn: () =>
      fetchWithValidation(
        `/v1/admin/charters/yachts${buildQueryString(filters as Record<string, unknown>)}`,
        yachtListResponse,
        client,
      ),
  })
}

export function getYachtQueryOptions(client: FetchWithValidationOptions, key: string) {
  return queryOptions({
    queryKey: chartersQueryKeys.yacht(key),
    queryFn: async () => {
      const result = await fetchWithValidation(
        `/v1/admin/charters/yachts/${encodeURIComponent(key)}`,
        yachtDetailResponse,
        client,
      )
      return result.data
    },
  })
}

// ---------- public surface ----------

export function getPublicProductsQueryOptions(
  client: FetchWithValidationOptions,
  filters: PublicProductsListFilters = {},
) {
  return queryOptions({
    queryKey: chartersQueryKeys.publicProductsList(filters),
    queryFn: () =>
      fetchWithValidation(
        `/v1/public/charters${buildQueryString(filters as Record<string, unknown>)}`,
        productListResponse,
        client,
      ),
  })
}

export function getPublicProductQueryOptions(client: FetchWithValidationOptions, key: string) {
  return queryOptions({
    queryKey: chartersQueryKeys.publicProduct(key),
    queryFn: async () => {
      const result = await fetchWithValidation(
        `/v1/public/charters/products/${encodeURIComponent(key)}`,
        productDetailResponse,
        client,
      )
      return result.data
    },
  })
}

export function getPublicVoyageQueryOptions(client: FetchWithValidationOptions, key: string) {
  return queryOptions({
    queryKey: chartersQueryKeys.publicVoyage(key),
    queryFn: async () => {
      const result = await fetchWithValidation(
        `/v1/public/charters/voyages/${encodeURIComponent(key)}`,
        voyageDetailResponse,
        client,
      )
      return result.data
    },
  })
}

export function getPublicYachtQueryOptions(client: FetchWithValidationOptions, key: string) {
  return queryOptions({
    queryKey: chartersQueryKeys.publicYacht(key),
    queryFn: async () => {
      const result = await fetchWithValidation(
        `/v1/public/charters/yachts/${encodeURIComponent(key)}`,
        yachtDetailResponse,
        client,
      )
      return result.data
    },
  })
}
