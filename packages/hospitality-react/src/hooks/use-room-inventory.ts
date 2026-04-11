"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getRoomInventoryQueryOptions } from "../query-options.js"

export interface UseRoomInventoryOptions {
  propertyId: string | null | undefined
  roomTypeId?: string | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useRoomInventory(options: UseRoomInventoryOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getRoomInventoryQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true) && Boolean(options.propertyId),
  })
}
