"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getRoomUnitQueryOptions } from "../query-options.js"

export interface UseRoomUnitOptions {
  enabled?: boolean
}

export function useRoomUnit(id: string | null | undefined, options: UseRoomUnitOptions = {}) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const { enabled = true } = options

  return useQuery({
    ...getRoomUnitQueryOptions({ baseUrl, fetcher }, id ?? "__missing__"),
    enabled: enabled && Boolean(id),
  })
}
