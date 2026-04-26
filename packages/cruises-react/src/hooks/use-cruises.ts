import { useQuery } from "@tanstack/react-query"

import { useVoyantCruisesContext } from "../provider.js"
import type { CruisesListFilters } from "../query-keys.js"
import { getCruisesQueryOptions } from "../query-options.js"

export interface UseCruisesOptions extends CruisesListFilters {
  enabled?: boolean
}

/**
 * Admin list of cruises — interleaves self-managed local rows with summaries
 * from every registered adapter. Returns the unified envelope shape
 * (`{ data, total, localTotal, adapterCount, adapterErrors? }`).
 */
export function useCruises(options: UseCruisesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getCruisesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
