"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantContext } from "../provider.js"
import { crmQueryKeys } from "../query-keys.js"
import { pipelineSingleResponse, stageSingleResponse } from "../schemas.js"

export interface CreatePipelineInput {
  name: string
  entityType?: string
  isDefault?: boolean
  sortOrder?: number
  [key: string]: unknown
}

export type UpdatePipelineInput = Partial<CreatePipelineInput>

export interface CreateStageInput {
  pipelineId: string
  name: string
  sortOrder?: number
  probability?: number | null
  isClosed?: boolean
  isWon?: boolean
  isLost?: boolean
  [key: string]: unknown
}

export type UpdateStageInput = Partial<CreateStageInput>

const deleteResponseSchema = z.object({ success: z.boolean() })

export function usePipelineMutation() {
  const { baseUrl, fetcher } = useVoyantContext()
  const queryClient = useQueryClient()

  const createPipeline = useMutation({
    mutationFn: async (input: CreatePipelineInput) => {
      const { data } = await fetchWithValidation(
        "/v1/crm/pipelines",
        pipelineSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.pipelines() })
    },
  })

  const updatePipeline = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdatePipelineInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/crm/pipelines/${id}`,
        pipelineSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.pipelines() })
      queryClient.setQueryData(crmQueryKeys.pipeline(data.id), data)
    },
  })

  const removePipeline = useMutation({
    mutationFn: async (id: string) => {
      return fetchWithValidation(
        `/v1/crm/pipelines/${id}`,
        deleteResponseSchema,
        { baseUrl, fetcher },
        { method: "DELETE" },
      )
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.pipelines() })
      queryClient.removeQueries({ queryKey: crmQueryKeys.pipeline(id) })
    },
  })

  const createStage = useMutation({
    mutationFn: async (input: CreateStageInput) => {
      const { data } = await fetchWithValidation(
        "/v1/crm/stages",
        stageSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.stages() })
    },
  })

  const updateStage = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateStageInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/crm/stages/${id}`,
        stageSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.stages() })
      queryClient.setQueryData(crmQueryKeys.stage(data.id), data)
    },
  })

  const removeStage = useMutation({
    mutationFn: async (id: string) => {
      return fetchWithValidation(
        `/v1/crm/stages/${id}`,
        deleteResponseSchema,
        { baseUrl, fetcher },
        { method: "DELETE" },
      )
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.stages() })
      queryClient.removeQueries({ queryKey: crmQueryKeys.stage(id) })
    },
  })

  return {
    createPipeline,
    updatePipeline,
    removePipeline,
    createStage,
    updateStage,
    removeStage,
  }
}
