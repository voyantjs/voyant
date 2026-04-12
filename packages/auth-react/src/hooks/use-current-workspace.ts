"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantAuthContext } from "../provider.js"
import { getCurrentWorkspaceQueryOptions } from "../query-options.js"

export interface UseCurrentWorkspaceOptions {
  enabled?: boolean
}

export function useCurrentWorkspace(options: UseCurrentWorkspaceOptions = {}) {
  const { baseUrl, fetcher } = useVoyantAuthContext()
  const { enabled = true } = options

  return useQuery({
    ...getCurrentWorkspaceQueryOptions({ baseUrl, fetcher }),
    enabled,
  })
}
