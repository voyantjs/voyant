"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantTransactionsContext } from "../provider.js"
import type { OrdersListFilters } from "../query-keys.js"
import { getOrdersQueryOptions } from "../query-options.js"

export interface UseOrdersOptions extends OrdersListFilters {
  enabled?: boolean
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { baseUrl, fetcher } = useVoyantTransactionsContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getOrdersQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
