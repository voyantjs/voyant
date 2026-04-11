"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getRatePlanInventoryOverridesQueryOptions } from "../query-options.js"

export interface UseRatePlanInventoryOverridesOptions {
  ratePlanId?: string | undefined
  roomTypeId?: string | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useRatePlanInventoryOverrides(options: UseRatePlanInventoryOverridesOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getRatePlanInventoryOverridesQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true),
  })
}
