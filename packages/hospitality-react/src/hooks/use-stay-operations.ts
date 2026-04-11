"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getStayOperationsQueryOptions } from "../query-options.js"

export interface UseStayOperationsOptions {
  propertyId?: string | null | undefined
  stayBookingItemId?: string | undefined
  roomUnitId?: string | undefined
  operationStatus?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useStayOperations(options: UseStayOperationsOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getStayOperationsQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true),
  })
}
