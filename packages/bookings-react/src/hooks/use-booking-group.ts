"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getBookingGroupQueryOptions } from "../query-options.js"

export interface UseBookingGroupOptions {
  enabled?: boolean
}

export function useBookingGroup(
  id: string | null | undefined,
  options: UseBookingGroupOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getBookingGroupQueryOptions({ baseUrl, fetcher }, id),
    enabled: enabled && Boolean(id),
  })
}
