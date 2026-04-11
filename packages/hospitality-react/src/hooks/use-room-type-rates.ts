"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getRoomTypeRatesQueryOptions } from "../query-options.js"

export interface UseRoomTypeRatesOptions {
  ratePlanId?: string | undefined
  roomTypeId?: string | undefined
  priceScheduleId?: string | undefined
  active?: boolean | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useRoomTypeRates(options: UseRoomTypeRatesOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getRoomTypeRatesQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true),
  })
}
