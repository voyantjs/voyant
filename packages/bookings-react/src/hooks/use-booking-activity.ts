"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getBookingActivityQueryOptions } from "../query-options.js"

export interface UseBookingActivityOptions {
  enabled?: boolean
}

export function useBookingActivity(
  bookingId: string | null | undefined,
  options: UseBookingActivityOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getBookingActivityQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}
