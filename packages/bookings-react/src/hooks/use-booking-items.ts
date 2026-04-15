"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getBookingItemsQueryOptions } from "../query-options.js"

export interface UseBookingItemsOptions {
  enabled?: boolean
}

export function useBookingItems(
  bookingId: string | null | undefined,
  options: UseBookingItemsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getBookingItemsQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}
