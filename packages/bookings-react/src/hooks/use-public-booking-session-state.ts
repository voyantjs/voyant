"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantBookingsContext } from "../provider.js"
import { getPublicBookingSessionStateQueryOptions } from "../query-options.js"

export interface UsePublicBookingSessionStateOptions {
  enabled?: boolean
}

export function usePublicBookingSessionState(
  sessionId: string | null | undefined,
  options: UsePublicBookingSessionStateOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantBookingsContext()
  const { enabled = true } = options

  return useQuery({
    ...getPublicBookingSessionStateQueryOptions({ baseUrl, fetcher }, sessionId),
    enabled: enabled && Boolean(sessionId),
  })
}
