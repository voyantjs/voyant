"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantContext } from "../provider.js"
import { crmQueryKeys } from "../query-keys.js"
import { quoteLineSingleResponse, quoteSingleResponse } from "../schemas.js"

export interface CreateQuoteInput {
  opportunityId: string
  currency: string
  status?: string
  validUntil?: string | null
  subtotalAmountCents?: number
  taxAmountCents?: number
  totalAmountCents?: number
  notes?: string | null
  [key: string]: unknown
}

export type UpdateQuoteInput = Partial<CreateQuoteInput>

export interface CreateQuoteLineInput {
  description: string
  currency: string
  quantity?: number
  unitPriceAmountCents?: number
  totalAmountCents?: number
  productId?: string | null
  supplierServiceId?: string | null
  [key: string]: unknown
}

export type UpdateQuoteLineInput = Partial<CreateQuoteLineInput>

const deleteResponseSchema = z.object({ success: z.boolean() })

export function useQuoteMutation() {
  const { baseUrl, fetcher } = useVoyantContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateQuoteInput) => {
      const { data } = await fetchWithValidation(
        "/v1/crm/quotes",
        quoteSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.quotes() })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateQuoteInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/crm/quotes/${id}`,
        quoteSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.quotes() })
      queryClient.setQueryData(crmQueryKeys.quote(data.id), data)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      return fetchWithValidation(
        `/v1/crm/quotes/${id}`,
        deleteResponseSchema,
        { baseUrl, fetcher },
        { method: "DELETE" },
      )
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.quotes() })
      queryClient.removeQueries({ queryKey: crmQueryKeys.quote(id) })
    },
  })

  const createLine = useMutation({
    mutationFn: async ({ quoteId, input }: { quoteId: string; input: CreateQuoteLineInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/crm/quotes/${quoteId}/lines`,
        quoteLineSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.quoteLines(vars.quoteId) })
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.quote(vars.quoteId) })
    },
  })

  const updateLine = useMutation({
    mutationFn: async ({
      quoteId: _quoteId,
      lineId,
      input,
    }: {
      quoteId: string
      lineId: string
      input: UpdateQuoteLineInput
    }) => {
      const { data } = await fetchWithValidation(
        `/v1/crm/quote-lines/${lineId}`,
        quoteLineSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.quoteLines(vars.quoteId) })
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.quote(vars.quoteId) })
    },
  })

  const removeLine = useMutation({
    mutationFn: async ({ quoteId: _quoteId, lineId }: { quoteId: string; lineId: string }) => {
      return fetchWithValidation(
        `/v1/crm/quote-lines/${lineId}`,
        deleteResponseSchema,
        { baseUrl, fetcher },
        { method: "DELETE" },
      )
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.quoteLines(vars.quoteId) })
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.quote(vars.quoteId) })
    },
  })

  return { create, update, remove, createLine, updateLine, removeLine }
}
