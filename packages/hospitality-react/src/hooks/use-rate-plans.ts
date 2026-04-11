"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getRatePlansQueryOptions } from "../query-options.js"

export interface UseRatePlansOptions {
  propertyId: string | null | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useRatePlans(options: UseRatePlansOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getRatePlansQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true) && Boolean(options.propertyId),
  })
}
