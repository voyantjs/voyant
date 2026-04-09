"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getSupplierStatusesQueryOptions } from "../query-options.js"

export interface UseSupplierStatusesOptions {
  enabled?: boolean
}

export function useSupplierStatuses(
  bookingId: string | null | undefined,
  options: UseSupplierStatusesOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getSupplierStatusesQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}
