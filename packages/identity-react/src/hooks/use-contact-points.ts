"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantIdentityContext } from "../provider.js"
import type { ContactPointsListFilters } from "../query-keys.js"
import { getContactPointsQueryOptions } from "../query-options.js"

export interface UseContactPointsOptions extends ContactPointsListFilters {
  enabled?: boolean
}

export function useContactPoints(options: UseContactPointsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantIdentityContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getContactPointsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
