"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantLegalContext } from "../provider.js"
import type { ResolvePolicyFilters } from "../query-keys.js"
import { getResolvePolicyQueryOptions } from "../query-options.js"

export interface UseResolvePolicyOptions {
  enabled?: boolean
}

/**
 * Resolves the applicable policy for the given scope (kind + productId, channelId, etc.).
 * Typically used with `kind: "cancellation"` to find the policy that applies to a booking.
 */
export function useResolvePolicy(
  filters: ResolvePolicyFilters,
  options: UseResolvePolicyOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true } = options

  return useQuery({
    ...getResolvePolicyQueryOptions({ baseUrl, fetcher }, filters),
    enabled: enabled && Boolean(filters.kind),
  })
}
