"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getHousekeepingTasksQueryOptions } from "../query-options.js"

export interface UseHousekeepingTasksOptions {
  propertyId?: string | null | undefined
  roomUnitId?: string | undefined
  stayBookingItemId?: string | undefined
  status?: string | undefined
  taskType?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useHousekeepingTasks(options: UseHousekeepingTasksOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getHousekeepingTasksQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true),
  })
}
