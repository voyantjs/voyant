"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantAuthContext } from "../provider.js"
import { getAuthStatusQueryOptions } from "../query-options.js"

export interface UseAuthStatusOptions {
  enabled?: boolean
}

export function useAuthStatus(options: UseAuthStatusOptions = {}) {
  const { baseUrl, fetcher } = useVoyantAuthContext()
  const { enabled = true } = options

  return useQuery({
    ...getAuthStatusQueryOptions({ baseUrl, fetcher }),
    enabled,
  })
}
