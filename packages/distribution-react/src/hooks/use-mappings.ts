"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantDistributionContext } from "../provider.js"
import type { MappingsListFilters } from "../query-keys.js"
import { getMappingsQueryOptions } from "../query-options.js"

export interface UseMappingsOptions extends MappingsListFilters {
  enabled?: boolean
}

export function useMappings(options: UseMappingsOptions = {}) {
  const client = useVoyantDistributionContext()
  const { enabled = true } = options
  return useQuery({ ...getMappingsQueryOptions(client, options), enabled })
}
