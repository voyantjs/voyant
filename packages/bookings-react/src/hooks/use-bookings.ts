"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { type BookingsListFilters, bookingsQueryKeys } from "../query-keys.js"
import { bookingListResponse } from "../schemas.js"

export interface UseBookingsOptions extends BookingsListFilters {
  enabled?: boolean
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    queryKey: bookingsQueryKeys.bookingsList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.search) params.set("search", filters.search)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()
      return fetchWithValidation(`/v1/bookings${qs ? `?${qs}` : ""}`, bookingListResponse, {
        baseUrl,
        fetcher,
      })
    },
    enabled,
  })
}
