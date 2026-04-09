"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingActivityResponse } from "../schemas.js"

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
    queryKey: bookingsQueryKeys.activity(bookingId ?? ""),
    queryFn: () =>
      fetchWithValidation(`/v1/bookings/${bookingId}/activity`, bookingActivityResponse, {
        baseUrl,
        fetcher,
      }),
    enabled: enabled && Boolean(bookingId),
  })
}
