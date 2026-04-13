"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getPublicBookingSessionQueryOptions } from "../query-options.js"

export interface UsePublicBookingSessionOptions {
  enabled?: boolean
}

export function usePublicBookingSession(
  sessionId: string | null | undefined,
  options: UsePublicBookingSessionOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getPublicBookingSessionQueryOptions({ baseUrl, fetcher }, sessionId),
    enabled: enabled && Boolean(sessionId),
  })
}
