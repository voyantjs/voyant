"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  generateContractDocumentInputSchema,
  insertContractSchema,
  updateContractSchema,
} from "@voyantjs/legal/contracts/validation"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantLegalContext } from "../provider.js"
import { legalQueryKeys } from "../query-keys.js"
import {
  legalContractGenerateDocumentResponse,
  legalContractSingleResponse,
  successEnvelope,
} from "../schemas.js"

export type CreateLegalContractInput = z.input<typeof insertContractSchema>
export type UpdateLegalContractInput = z.input<typeof updateContractSchema>
export type GenerateLegalContractDocumentInput = z.input<typeof generateContractDocumentInputSchema>

export function useLegalContractMutation() {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateLegalContractInput) => {
      const { data } = await fetchWithValidation(
        "/v1/admin/legal/contracts",
        legalContractSingleResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contracts() })
      queryClient.setQueryData(legalQueryKeys.contract(data.id), data)
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateLegalContractInput }) => {
      const { data } = await fetchWithValidation(
        `/v1/admin/legal/contracts/${id}`,
        legalContractSingleResponse,
        { baseUrl, fetcher },
        { method: "PATCH", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contracts() })
      queryClient.setQueryData(legalQueryKeys.contract(data.id), data)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchWithValidation(
        `/v1/admin/legal/contracts/${id}`,
        successEnvelope,
        { baseUrl, fetcher },
        {
          method: "DELETE",
        },
      ),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contracts() })
      queryClient.removeQueries({ queryKey: legalQueryKeys.contract(id) })
      queryClient.removeQueries({ queryKey: legalQueryKeys.contractSignatures(id) })
      queryClient.removeQueries({ queryKey: legalQueryKeys.contractAttachments(id) })
    },
  })

  const issue = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await fetchWithValidation(
        `/v1/admin/legal/contracts/${id}/issue`,
        legalContractSingleResponse,
        { baseUrl, fetcher },
        { method: "POST" },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contracts() })
      queryClient.setQueryData(legalQueryKeys.contract(data.id), data)
    },
  })

  const send = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await fetchWithValidation(
        `/v1/admin/legal/contracts/${id}/send`,
        legalContractSingleResponse,
        { baseUrl, fetcher },
        { method: "POST" },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contracts() })
      queryClient.setQueryData(legalQueryKeys.contract(data.id), data)
    },
  })

  const execute = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await fetchWithValidation(
        `/v1/admin/legal/contracts/${id}/execute`,
        legalContractSingleResponse,
        { baseUrl, fetcher },
        { method: "POST" },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contracts() })
      queryClient.setQueryData(legalQueryKeys.contract(data.id), data)
    },
  })

  const voidContract = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await fetchWithValidation(
        `/v1/admin/legal/contracts/${id}/void`,
        legalContractSingleResponse,
        { baseUrl, fetcher },
        { method: "POST" },
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contracts() })
      queryClient.setQueryData(legalQueryKeys.contract(data.id), data)
    },
  })

  /**
   * Trigger a fresh document render for a contract. First call issues the
   * draft + generates via the server's configured generator; subsequent
   * calls (see `regenerate`) replace the attachment.
   */
  const generateDocument = useMutation({
    mutationFn: async ({
      id,
      input = {},
    }: {
      id: string
      input?: GenerateLegalContractDocumentInput
    }) => {
      const { data } = await fetchWithValidation(
        `/v1/admin/legal/contracts/${id}/generate-document`,
        legalContractGenerateDocumentResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contract(variables.id) })
      void queryClient.invalidateQueries({
        queryKey: legalQueryKeys.contractAttachments(variables.id),
      })
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contracts() })
    },
  })

  /**
   * Same as `generateDocument` but explicit about replacing an existing
   * attachment of the same kind. Use this for the operator's "Regenerate"
   * button so stale PDFs don't accumulate.
   */
  const regenerateDocument = useMutation({
    mutationFn: async ({
      id,
      input = {},
    }: {
      id: string
      input?: GenerateLegalContractDocumentInput
    }) => {
      const { data } = await fetchWithValidation(
        `/v1/admin/legal/contracts/${id}/regenerate-document`,
        legalContractGenerateDocumentResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contract(variables.id) })
      void queryClient.invalidateQueries({
        queryKey: legalQueryKeys.contractAttachments(variables.id),
      })
      void queryClient.invalidateQueries({ queryKey: legalQueryKeys.contracts() })
    },
  })

  return {
    create,
    update,
    remove,
    issue,
    send,
    execute,
    voidContract,
    generateDocument,
    regenerateDocument,
  }
}
