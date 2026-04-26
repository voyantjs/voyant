import { useQuery } from "@tanstack/react-query"

import { useVoyantChartersContext } from "../provider.js"
import type { YachtsListFilters } from "../query-keys.js"
import { getYachtQueryOptions, getYachtsQueryOptions } from "../query-options.js"

export interface UseCharterYachtsOptions extends YachtsListFilters {
  enabled?: boolean
}

export function useCharterYachts(options: UseCharterYachtsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getYachtsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}

export interface UseCharterYachtOptions {
  enabled?: boolean
}

export function useCharterYacht(
  key: string | null | undefined,
  options: UseCharterYachtOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true } = options
  return useQuery({
    ...getYachtQueryOptions({ baseUrl, fetcher }, key ?? ""),
    enabled: enabled && !!key,
  })
}
