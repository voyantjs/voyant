"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantDistributionContext } from "../provider.js"
import type { BookingLinksListFilters } from "../query-keys.js"
import { getBookingLinksQueryOptions } from "../query-options.js"

export interface UseBookingLinksOptions extends BookingLinksListFilters {
  enabled?: boolean
}

export function useBookingLinks(options: UseBookingLinksOptions = {}) {
  const client = useVoyantDistributionContext()
  const { enabled = true } = options
  return useQuery({ ...getBookingLinksQueryOptions(client, options), enabled })
}
