"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantFinanceContext } from "../provider.js"
import { getPublicPaymentSessionQueryOptions } from "../query-options.js"

export interface UsePublicPaymentSessionOptions {
  enabled?: boolean
}

export function usePublicPaymentSession(
  sessionId: string | null | undefined,
  options: UsePublicPaymentSessionOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantFinanceContext()
  const { enabled = true } = options

  return useQuery({
    ...getPublicPaymentSessionQueryOptions({ baseUrl, fetcher }, sessionId),
    enabled: enabled && Boolean(sessionId),
  })
}
