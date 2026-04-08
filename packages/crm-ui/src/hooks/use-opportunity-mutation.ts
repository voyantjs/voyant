"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantContext } from "../provider.js"
import { crmQueryKeys } from "../query-keys.js"
import { opportunitySingleResponse } from "../schemas.js"

export interface CreateOpportunityInput {
  title: string
  pipelineId: string
  stageId: string
  personId?: string | null
  organizationId?: string | null
  ownerId?: string | null
  status?: string
  valueAmountCents?: number | null
  valueCurrency?: string | null
  expectedCloseDate?: string | null
  source?: string | null
  sourceRef?: string | null
  lostReason?: string | null
  tags?: string[]
  [key: string]: unknown
}

export type UpdateOpportunityInput = Partial<CreateOpportunityInput>

const deleteResponseSchema = z.object({ success: z.boolean() })

export function useOpportunityMutation() {
  const { baseUrl, fetcher } = useVoyantContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateOpportunityInput) => {
      const { data } = await fetchWithValidation(
        "/v1/crm/opportunities",
        opportunitySingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.opportunities() })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateOpportunityInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/crm/opportunities/${id}`,
        opportunitySingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.opportunities() })
      queryClient.setQueryData(crmQueryKeys.opportunity(data.id), data)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      return fetchWithValidation(
        `/v1/crm/opportunities/${id}`,
        deleteResponseSchema,
        { baseUrl, fetcher },
        { method: "DELETE" },
      )
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.opportunities() })
      queryClient.removeQueries({ queryKey: crmQueryKeys.opportunity(id) })
    },
  })

  return { create, update, remove }
}
