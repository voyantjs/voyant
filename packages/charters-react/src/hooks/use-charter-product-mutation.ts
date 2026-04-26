import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantChartersContext } from "../provider.js"
import { chartersQueryKeys } from "../query-keys.js"
import { type CharterProductRecord, productSingleResponse } from "../schemas.js"

export interface CreateCharterProductInput {
  slug: string
  name: string
  lineSupplierId?: string | null
  defaultYachtId?: string | null
  description?: string | null
  shortDescription?: string | null
  heroImageUrl?: string | null
  mapImageUrl?: string | null
  regions?: string[]
  themes?: string[]
  status?: "draft" | "awaiting_review" | "live" | "archived"
  defaultBookingModes?: Array<"per_suite" | "whole_yacht">
  defaultMybaTemplateId?: string | null
  defaultApaPercent?: string | null
}

export type UpdateCharterProductInput = Partial<CreateCharterProductInput>

/**
 * Mutation set for self-managed charter products: create / update / archive /
 * recompute aggregates. Writes against external products return 409 from
 * the server; this hook surfaces those as VoyantApiError.
 */
export function useCharterProductMutation() {
  const { baseUrl, fetcher } = useVoyantChartersContext()
  const client = { baseUrl, fetcher }
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateCharterProductInput): Promise<CharterProductRecord> => {
      const result = await fetchWithValidation(
        "/v1/admin/charters/products",
        productSingleResponse,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chartersQueryKeys.products() })
    },
  })

  const update = useMutation({
    mutationFn: async ({
      key,
      input,
    }: {
      key: string
      input: UpdateCharterProductInput
    }): Promise<CharterProductRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/charters/products/${encodeURIComponent(key)}`,
        productSingleResponse,
        client,
        { method: "PUT", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chartersQueryKeys.products() })
      queryClient.setQueryData(chartersQueryKeys.product(data.id), data)
    },
  })

  const archive = useMutation({
    mutationFn: async (key: string): Promise<CharterProductRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/charters/products/${encodeURIComponent(key)}`,
        productSingleResponse,
        client,
        { method: "DELETE" },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chartersQueryKeys.products() })
      queryClient.setQueryData(chartersQueryKeys.product(data.id), data)
    },
  })

  const recomputeAggregates = useMutation({
    mutationFn: async (key: string): Promise<CharterProductRecord> => {
      const result = await fetchWithValidation(
        `/v1/admin/charters/products/${encodeURIComponent(key)}/aggregates/recompute`,
        productSingleResponse,
        client,
        { method: "POST" },
      )
      return result.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: chartersQueryKeys.products() })
      queryClient.setQueryData(chartersQueryKeys.product(data.id), data)
    },
  })

  return { create, update, archive, recomputeAggregates }
}
