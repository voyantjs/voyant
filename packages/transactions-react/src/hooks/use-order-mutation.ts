"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertOrderSchema, updateOrderSchema } from "@voyantjs/transactions"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantTransactionsContext } from "../provider.js"
import { transactionsQueryKeys } from "../query-keys.js"
import { orderSingleResponse, successEnvelope } from "../schemas.js"

export type CreateOrderInput = z.input<typeof insertOrderSchema>
export type UpdateOrderInput = z.input<typeof updateOrderSchema>

export function useOrderMutation() {
  const { baseUrl, fetcher } = useVoyantTransactionsContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const { data } = await fetchWithValidation(
        "/v1/transactions/orders",
        orderSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.orders() })
      queryClient.setQueryData(transactionsQueryKeys.order(data.id), data)
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateOrderInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/transactions/orders/${id}`,
        orderSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.orders() })
      queryClient.setQueryData(transactionsQueryKeys.order(data.id), data)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/transactions/orders/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        {
          method: "DELETE",
        },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.orders() })
      queryClient.removeQueries({ queryKey: transactionsQueryKeys.order(id) })
    },
  })

  return { create, update, remove }
}
