"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getMealPlansQueryOptions } from "../query-options.js"

export interface UseMealPlansOptions {
  propertyId: string | null | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useMealPlans(options: UseMealPlansOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getMealPlansQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true) && Boolean(options.propertyId),
  })
}
