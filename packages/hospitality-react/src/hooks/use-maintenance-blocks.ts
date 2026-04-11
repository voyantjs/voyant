"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getMaintenanceBlocksQueryOptions } from "../query-options.js"

export interface UseMaintenanceBlocksOptions {
  propertyId: string | null | undefined
  limit?: number | undefined
  offset?: number | undefined
  enabled?: boolean | undefined
}

export function useMaintenanceBlocks(options: UseMaintenanceBlocksOptions) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()

  return useQuery({
    ...getMaintenanceBlocksQueryOptions({ baseUrl, fetcher }, options),
    enabled: Boolean(options.enabled ?? true) && Boolean(options.propertyId),
  })
}
