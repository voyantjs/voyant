import { useQuery } from "@tanstack/react-query"

import { useVoyantChartersContext } from "../provider.js"
import type { VoyagesListFilters } from "../query-keys.js"
import { getVoyageQueryOptions, getVoyagesQueryOptions } from "../query-options.js"

export interface UseCharterVoyagesOptions extends VoyagesListFilters {
  enabled?: boolean
}

export function useCharterVoyages(options: UseCharterVoyagesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getVoyagesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}

export interface UseCharterVoyageOptions {
  enabled?: boolean
  include?: ReadonlyArray<"suites" | "schedule">
}

export function useCharterVoyage(
  key: string | null | undefined,
  options: UseCharterVoyageOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const { enabled = true, include } = options
  return useQuery({
    ...getVoyageQueryOptions({ baseUrl, fetcher }, key ?? "", { include }),
    enabled: enabled && !!key,
  })
}
