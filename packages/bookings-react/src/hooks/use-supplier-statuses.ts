"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantBookingsContext } from "../provider.js"
import { bookingsQueryKeys } from "../query-keys.js"
import { bookingSupplierStatusesResponse } from "../schemas.js"

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
    queryKey: bookingsQueryKeys.supplierStatuses(bookingId ?? ""),
    queryFn: () =>
      fetchWithValidation(
        `/v1/bookings/${bookingId}/supplier-statuses`,
        bookingSupplierStatusesResponse,
        { baseUrl, fetcher },
      ),
    enabled: enabled && Boolean(bookingId),
  })
}
