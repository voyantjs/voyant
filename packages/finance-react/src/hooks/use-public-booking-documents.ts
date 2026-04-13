"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getPublicBookingDocumentsQueryOptions } from "../query-options.js"

export interface UsePublicBookingDocumentsOptions {
  enabled?: boolean
}

export function usePublicBookingDocuments(
  bookingId: string | null | undefined,
  options: UsePublicBookingDocumentsOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getPublicBookingDocumentsQueryOptions({ baseUrl, fetcher }, bookingId),
    enabled: enabled && Boolean(bookingId),
  })
}
