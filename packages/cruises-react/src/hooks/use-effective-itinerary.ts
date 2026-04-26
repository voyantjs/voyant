import { useQuery } from "@tanstack/react-query"

import { useVoyantCruisesContext } from "../provider.js"
import { getEffectiveItineraryQueryOptions } from "../query-options.js"

export interface UseEffectiveItineraryOptions {
  enabled?: boolean
}

/**
 * Effective itinerary days for a sailing — returns the merged result of the
 * cruise's day template plus per-sailing overrides (skipped ports, alternate
 * times, ship swaps).
 */
export function useEffectiveItinerary(
  sailingKey: string | null | undefined,
  options: UseEffectiveItineraryOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true } = options
  return useQuery({
    ...getEffectiveItineraryQueryOptions({ baseUrl, fetcher }, sailingKey ?? ""),
    enabled: enabled && !!sailingKey,
  })
}
