"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getBookingNotesQueryOptions } from "../query-options.js"

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
    ...getBookingNotesQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}
