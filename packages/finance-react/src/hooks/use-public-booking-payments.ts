"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getPublicBookingPaymentsQueryOptions } from "../query-options.js"

export interface UsePublicBookingPaymentsOptions {
  enabled?: boolean
}

export function usePublicBookingPayments(
  bookingId: string | null | undefined,
  options: UsePublicBookingPaymentsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getPublicBookingPaymentsQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}
