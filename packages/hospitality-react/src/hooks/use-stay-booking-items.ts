"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getStayBookingItemsQueryOptions } from "../query-options.js"

export interface UseStayBookingItemsOptions {
  propertyId?: string | null | undefined
  bookingItemId?: string | undefined
  roomTypeId?: string | undefined
  roomUnitId?: string | undefined
  ratePlanId?: string | undefined
  status?: string | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useStayBookingItems(options: UseStayBookingItemsOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getStayBookingItemsQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true),
  })
}
