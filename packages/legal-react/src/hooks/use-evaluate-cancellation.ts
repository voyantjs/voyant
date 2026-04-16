"use client"

import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantLegalContext } from "../provider.js"
import { legalQueryKeys } from "../query-keys.js"
import { cancellationResultResponse } from "../schemas.js"

export interface EvaluateCancellationInput {
  daysBeforeDeparture: number
  totalCents: number
  currency?: string
}

export interface UseEvaluateCancellationOptions {
  enabled?: boolean
}

/**
 * Evaluates a cancellation policy as a cacheable query. Returns the refund
 * percent/amount/type and the applied rule. Runs automatically when all of
 * policyId/daysBeforeDeparture/totalCents are provided and `enabled` is true.
 */
export function useEvaluateCancellation(
  policyId: string | null | undefined,
  input: EvaluateCancellationInput | null | undefined,
  options: UseEvaluateCancellationOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true } = options

  const shouldRun = Boolean(policyId) && Boolean(input) && enabled

  return useQuery({
    ...queryOptions({
      queryKey: [...legalQueryKeys.policies(), "evaluate", policyId, input],
      queryFn: () => {
        if (!policyId || !input) throw new Error("policyId and input required")
        return fetchWithValidation(
          `/v1/admin/legal/policies/${policyId}/evaluate`,
          cancellationResultResponse,
          { baseUrl, fetcher },
          { method: "POST", body: JSON.stringify(input) },
        )
      },
    }),
    enabled: shouldRun,
  })
}

/**
 * Imperative mutation variant of the cancellation evaluation for cases where
 * the caller needs to trigger evaluation manually (e.g. with ad-hoc inputs).
 */
export function useEvaluateCancellationMutation(policyId: string | null | undefined) {
  const { baseUrl, fetcher } = useVoyantLegalContext()

  return useMutation({
    mutationFn: async (input: EvaluateCancellationInput) => {
      if (!policyId) {
        throw new Error("policyId is required")
      }
      const { data } = await fetchWithValidation(
        `/v1/admin/legal/policies/${policyId}/evaluate`,
        cancellationResultResponse,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      )
      return data
    },
  })
}
