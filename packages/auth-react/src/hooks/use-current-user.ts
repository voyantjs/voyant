"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantAuthContext } from "../provider.js"
import { getCurrentUserQueryOptions } from "../query-options.js"

export interface UseCurrentUserOptions {
  enabled?: boolean
}

export function useCurrentUser(options: UseCurrentUserOptions = {}) {
  const { baseUrl, fetcher } = useVoyantAuthContext()
  const { enabled = true } = options

  return useQuery({
    ...getCurrentUserQueryOptions({ baseUrl, fetcher }),
    enabled,
  })
}
