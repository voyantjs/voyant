import { useQuery } from "@tanstack/react-query"

import { useVoyantCruisesContext } from "../provider.js"
import { getCruiseQueryOptions } from "../query-options.js"

export interface UseCruiseOptions {
  enabled?: boolean
  include?: ReadonlyArray<"sailings" | "days">
}

/**
 * Admin cruise detail. Accepts both local TypeIDs (`cru_*`) and external
 * adapter keys (`<provider>:<ref>`); the server dispatches to the local DB
 * or to the registered adapter accordingly.
 */
export function useCruise(key: string | null | undefined, options: UseCruiseOptions = {}) {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const { enabled = true, include } = options
  return useQuery({
    ...getCruiseQueryOptions({ baseUrl, fetcher }, key ?? "", { include }),
    enabled: enabled && !!key,
  })
}
