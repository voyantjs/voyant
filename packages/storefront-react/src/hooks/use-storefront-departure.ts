"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantStorefrontContext } from "../provider.js"
import { getStorefrontDepartureQueryOptions } from "../query-options.js"

export interface UseStorefrontDepartureOptions {
  enabled?: boolean
}

export function useStorefrontDeparture(
  departureId: string | null | undefined,
  options: UseStorefrontDepartureOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantStorefrontContext()
  const { enabled = true } = options

  return useQuery({
    ...getStorefrontDepartureQueryOptions({ baseUrl, fetcher }, departureId ?? ""),
    enabled: enabled && Boolean(departureId),
  })
}
