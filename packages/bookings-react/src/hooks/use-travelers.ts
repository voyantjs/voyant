"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getTravelersQueryOptions } from "../query-options.js"

export interface UseTravelersOptions {
  enabled?: boolean
}

export function useTravelers(
  bookingId: string | null | undefined,
  options: UseTravelersOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getTravelersQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}
