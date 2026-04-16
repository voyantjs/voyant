"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import type { BookingGroupsListFilters } from "../query-keys.js"
import { getBookingGroupsQueryOptions } from "../query-options.js"

export interface UseBookingGroupsOptions extends BookingGroupsListFilters {
  enabled?: boolean
}

export function useBookingGroups(options: UseBookingGroupsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getBookingGroupsQueryOptions({ baseUrl, fetcher }, options),
    enabled,
  })
}
