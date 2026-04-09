"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingNotesResponse } from "../schemas.js"

export interface UseBookingNotesOptions {
  enabled?: boolean
}

export function useBookingNotes(
  bookingId: string | null | undefined,
  options: UseBookingNotesOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    queryKey: bookingsQueryKeys.notes(bookingId ?? ""),
    queryFn: () =>
      fetchWithValidation(`/v1/bookings/${bookingId}/notes`, bookingNotesResponse, {
        baseUrl,
        fetcher,
      }),
    enabled: enabled && Boolean(bookingId),
  })
}
