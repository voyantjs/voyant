"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { insertOfferSchema, updateOfferSchema } from "@voyantjs/transactions"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantTransactionsContext } from "../provider.js"
import { transactionsQueryKeys } from "../query-keys.js"
import { offerSingleResponse, successEnvelope } from "../schemas.js"

export type CreateOfferInput = z.input<typeof insertOfferSchema>
export type UpdateOfferInput = z.input<typeof updateOfferSchema>

export function useOfferMutation() {
  const { baseUrl, fetcher } = useVoyantTransactionsContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateOfferInput) => {
      const { data } = await fetchWithValidation(
        "/v1/transactions/offers",
        offerSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.offers() })
      queryClient.setQueryData(transactionsQueryKeys.offer(data.id), data)
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateOfferInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/transactions/offers/${id}`,
        offerSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.offers() })
      queryClient.setQueryData(transactionsQueryKeys.offer(data.id), data)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/transactions/offers/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        {
          method: "DELETE",
        },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.offers() })
      queryClient.removeQueries({ queryKey: transactionsQueryKeys.offer(id) })
    },
  })

  return { create, update, remove }
}
