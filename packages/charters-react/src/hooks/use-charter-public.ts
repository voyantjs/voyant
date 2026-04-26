import { useQuery } from "@tanstack/react-query"

import { useVoyantChartersContext } from "../provider.js"
import type { PublicProductsListFilters } from "../query-keys.js"
import {
  getPublicProductQueryOptions,
  getPublicProductsQueryOptions,
  getPublicVoyageQueryOptions,
  getPublicYachtQueryOptions,
} from "../query-options.js"

/**
 * Public charter products list (anonymous browse). Forces `status='live'`
 * server-side regardless of any extra filters; fans out to local DB +
 * registered adapters.
 */
export function usePublicCharterProducts(
  options: PublicProductsListFilters & { enabled?: boolean } = {},
) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getPublicProductsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}

/** Public product detail by slug or external `<provider>:<ref>` key. */
export function usePublicCharterProduct(
  key: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true } = options
  return useQuery({
    ...getPublicProductQueryOptions({ baseUrl, fetcher }, key ?? ""),
    enabled: enabled && !!key,
  })
}

export function usePublicCharterVoyage(
  key: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true } = options
  return useQuery({
    ...getPublicVoyageQueryOptions({ baseUrl, fetcher }, key ?? ""),
    enabled: enabled && !!key,
  })
}

export function usePublicCharterYacht(
  key: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true } = options
  return useQuery({
    ...getPublicYachtQueryOptions({ baseUrl, fetcher }, key ?? ""),
    enabled: enabled && !!key,
  })
}
