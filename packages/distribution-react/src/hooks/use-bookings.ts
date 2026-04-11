"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantDistributionContext } from "../provider.js"
import type { BookingsListFilters } from "../query-keys.js"
import { getBookingsQueryOptions } from "../query-options.js"

export interface UseBookingsOptions extends BookingsListFilters {
  enabled?: boolean
}

export function useBookings(options: UseBookingsOptions = {}) {
  const client = useVoyantDistributionContext()
  const { enabled = true } = options
  return useQuery({ ...getBookingsQueryOptions(client, options), enabled })
}
