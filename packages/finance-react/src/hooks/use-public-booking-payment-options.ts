"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import type { PublicBookingPaymentOptionsFilters } from "../query-keys.js"
import { getPublicBookingPaymentOptionsQueryOptions } from "../query-options.js"

export interface UsePublicBookingPaymentOptionsOptions extends PublicBookingPaymentOptionsFilters {
  enabled?: boolean
}

export function usePublicBookingPaymentOptions(
  bookingId: string | null | undefined,
  options: UsePublicBookingPaymentOptionsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getPublicBookingPaymentOptionsQueryOptions({ baseUrl, fetcher }, bookingId, filters),
    enabled: enabled && Boolean(bookingId),
  })
}
