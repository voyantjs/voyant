"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantProductsContext } from "../provider.js"
import { productsQueryKeys } from "../query-keys.js"
import {
  type CreateProductDayInput,
  productDayResponse,
  successEnvelope,
  type UpdateProductDayInput,
} from "../schemas.js"

export function useProductDayMutation() {
  const { baseUrl, fetcher } = useVoyantProductsContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async ({ productId, ...input }: CreateProductDayInput & { productId: string }) => {
      const { data } = await fetchWithValidation(
        `/v1/products/${productId}/days`,
        productDayResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.productDays(data.productId),
      })
    },
  })

  const update = useMutation({
    mutationFn: async ({
      productId,
      dayId,
      input,
    }: {
      productId: string
      dayId: string
      input: UpdateProductDayInput
    }) => {
      const { data } = await fetchWithValidation(
        `/v1/products/${productId}/days/${dayId}`,
        productDayResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.productDays(data.productId),
      })
    },
  })

  const remove = useMutation({
    mutationFn: async ({ productId, dayId }: { productId: string; dayId: string }) =>
      fetchWithValidation(
        `/v1/products/${productId}/days/${dayId}`,
        successEnvelope,
        { baseUrl, fetcher },
        { method: "DELETE" },
      ),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.productDays(variables.productId),
      })
    },
  })

  return { create, update, remove }
}
