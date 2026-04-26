import { useQuery } from "@tanstack/react-query"

import { useVoyantChartersContext } from "../provider.js"
import type { ProductsListFilters } from "../query-keys.js"
import { getProductQueryOptions, getProductsQueryOptions } from "../query-options.js"

export interface UseCharterProductsOptions extends ProductsListFilters {
  enabled?: boolean
}

/**
 * Admin product list — fans out to local DB + every registered charter
 * adapter. Items are tagged with `source: 'local' | 'external'` for the
 * UI to render an external badge.
 */
export function useCharterProducts(options: UseCharterProductsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getProductsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}

export interface UseCharterProductOptions {
  enabled?: boolean
  include?: ReadonlyArray<"voyages" | "yacht">
}

/**
 * Admin product detail. Accepts both local TypeIDs (`chrt_*`) and
 * external `<provider>:<ref>` keys; the server dispatches to the local
 * DB or the registered adapter accordingly.
 */
export function useCharterProduct(
  key: string | null | undefined,
  options: UseCharterProductOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true, include } = options
  return useQuery({
    ...getProductQueryOptions({ baseUrl, fetcher }, key ?? "", { include }),
    enabled: enabled && !!key,
  })
}
