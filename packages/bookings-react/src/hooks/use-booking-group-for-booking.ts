"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getBookingGroupForBookingQueryOptions } from "../query-options.js"

export interface UseBookingGroupForBookingOptions {
  enabled?: boolean
}

export function useBookingGroupForBooking(
  bookingId: string | null | undefined,
  options: UseBookingGroupForBookingOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getBookingGroupForBookingQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}
