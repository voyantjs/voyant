"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingSingleResponse } from "../schemas.js"

export interface UseBookingOptions {
  enabled?: boolean
}

export function useBooking(id: string | null | undefined, options: UseBookingOptions = {}) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    queryKey: bookingsQueryKeys.booking(id ?? ""),
    queryFn: () =>
      fetchWithValidation(`/v1/bookings/${id}`, bookingSingleResponse, { baseUrl, fetcher }),
    enabled: enabled && Boolean(id),
  })
}
