import { useQuery } from "@tanstack/react-query"

import { useVoyantCruisesContext } from "../provider.js"
import type { SailingsListFilters } from "../query-keys.js"
import { getSailingQueryOptions, getSailingsQueryOptions } from "../query-options.js"

export interface UseSailingsOptions extends SailingsListFilters {
  enabled?: boolean
}

export function useSailings(options: UseSailingsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true, ...filters } = options
  return useQuery({
    ...getSailingsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}

export interface UseSailingOptions {
  enabled?: boolean
  include?: ReadonlyArray<"pricing" | "itinerary">
}

/** Sailing detail by unified key (local TypeID or `<provider>:<ref>`). */
export function useSailing(key: string | null | undefined, options: UseSailingOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true, include } = options
  return useQuery({
    ...getSailingQueryOptions({ baseUrl, fetcher }, key ?? "", { include }),
    enabled: enabled && !!key,
  })
}
