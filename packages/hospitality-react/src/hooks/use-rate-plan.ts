"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getRatePlanQueryOptions } from "../query-options.js"

export interface UseRatePlanOptions {
  enabled?: boolean
}

export function useRatePlan(id: string | null | undefined, options: UseRatePlanOptions = {}) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const { enabled = true } = options

  return useQuery({
    ...getRatePlanQueryOptions({ baseUrl, fetcher }, id ?? "__missing__"),
    enabled: enabled && Boolean(id),
  })
}
