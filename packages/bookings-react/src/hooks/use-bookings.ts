"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import type { BookingsListFilters } from "../query-keys.js"
import { getBookingsQueryOptions } from "../query-options.js"

export interface UseBookingsOptions extends BookingsListFilters {
  enabled?: boolean
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getBookingsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
