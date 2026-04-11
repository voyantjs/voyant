"use client"

import { queryOptions } from "@tanstack/react-query"

import { type FetchWithValidationOptions, fetchWithValidation } from "./client.js"
import type { UseOffersOptions } from "./hooks/use-offers.js"
import type { UseOrdersOptions } from "./hooks/use-orders.js"
import { transactionsQueryKeys } from "./query-keys.js"
import {
  offerListResponse,
  offerSingleResponse,
  orderListResponse,
  orderSingleResponse,
} from "./schemas.js"

function toQueryString(filters: Record<string, string | number | boolean | null | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export function getOffersQueryOptions(
  client: FetchWithValidationOptions,
  options: UseOffersOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options
  return queryOptions({
    queryKey: transactionsQueryKeys.offersList(filters),
    queryFn: () =>
      fetchWithValidation(
        `/v1/transactions/offers${toQueryString(filters)}`,
        offerListResponse,
        client,
      ),
  })
}

export function getOfferQueryOptions(client: FetchWithValidationOptions, id: string) {
  return queryOptions({
    queryKey: transactionsQueryKeys.offer(id),
    queryFn: async () => {
      const { data } = await fetchWithValidation(
        `/v1/transactions/offers/${id}`,
        offerSingleResponse,
        client,
      )
      return data
    },
  })
}

export function getOrdersQueryOptions(
  client: FetchWithValidationOptions,
  options: UseOrdersOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options
  return queryOptions({
    queryKey: transactionsQueryKeys.ordersList(filters),
    queryFn: () =>
      fetchWithValidation(
        `/v1/transactions/orders${toQueryString(filters)}`,
        orderListResponse,
        client,
      ),
  })
}

export function getOrderQueryOptions(client: FetchWithValidationOptions, id: string) {
  return queryOptions({
    queryKey: transactionsQueryKeys.order(id),
    queryFn: async () => {
      const { data } = await fetchWithValidation(
        `/v1/transactions/orders/${id}`,
        orderSingleResponse,
        client,
      )
      return data
    },
  })
}
