"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getPassengersQueryOptions } from "../query-options.js"

export interface UsePassengersOptions {
  enabled?: boolean
}

export function usePassengers(
  bookingId: string | null | undefined,
  options: UsePassengersOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getPassengersQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}
