"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getRoomTypesQueryOptions } from "../query-options.js"

export interface UseRoomTypesOptions {
  propertyId: string | null | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useRoomTypes(options: UseRoomTypesOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getRoomTypesQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true) && Boolean(options.propertyId),
  })
}
