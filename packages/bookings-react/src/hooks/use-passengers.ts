"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingPassengersResponse } from "../schemas.js"

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
    queryKey: bookingsQueryKeys.passengers(bookingId ?? ""),
    queryFn: () =>
      fetchWithValidation(`/v1/bookings/${bookingId}/passengers`, bookingPassengersResponse, {
        baseUrl,
        fetcher,
      }),
    enabled: enabled && Boolean(bookingId),
  })
}
