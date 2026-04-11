"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getMealPlanQueryOptions } from "../query-options.js"

export interface UseMealPlanOptions {
  enabled?: boolean
}

export function useMealPlan(id: string | null | undefined, options: UseMealPlanOptions = {}) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const { enabled = true } = options

  return useQuery({
    ...getMealPlanQueryOptions({ baseUrl, fetcher }, id ?? "__missing__"),
    enabled: enabled && Boolean(id),
  })
}
