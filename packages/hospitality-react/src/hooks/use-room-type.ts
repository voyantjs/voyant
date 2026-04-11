"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantHospitalityContext } from "../provider.js"
import { getRoomTypeQueryOptions } from "../query-options.js"

export interface UseRoomTypeOptions {
  enabled?: boolean
}

export function useRoomType(id: string | null | undefined, options: UseRoomTypeOptions = {}) {
  const { baseUrl, fetcher } = useVoyantHospitalityContext()
  const { enabled = true } = options

  return useQuery({
    ...getRoomTypeQueryOptions({ baseUrl, fetcher }, id ?? "__missing__"),
    enabled: enabled && Boolean(id),
  })
}
