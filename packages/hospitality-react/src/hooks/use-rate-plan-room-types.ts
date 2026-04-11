"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getRatePlanRoomTypesQueryOptions } from "../query-options.js"

export interface UseRatePlanRoomTypesOptions {
  ratePlanId?: string | undefined
  roomTypeId?: string | undefined
  productId?: string | undefined
  active?: boolean | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useRatePlanRoomTypes(options: UseRatePlanRoomTypesOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getRatePlanRoomTypesQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true),
  })
}
