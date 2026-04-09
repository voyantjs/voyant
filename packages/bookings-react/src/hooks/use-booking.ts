"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getBookingQueryOptions } from "../query-options.js"

export interface UseBookingOptions {
  enabled?: boolean
}

export function useBooking(id: string | null | undefined, options: UseBookingOptions = {}) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getBookingQueryOptions({ baseUrl, fetcher }, id),
    enabled: enabled && Boolean(id),
  })
}
