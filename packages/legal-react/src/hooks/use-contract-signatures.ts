"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantLegalContext } from "../provider.js"
import { getLegalContractSignaturesQueryOptions } from "../query-options.js"

export interface UseLegalContractSignaturesOptions {
  contractId: string
  enabled?: boolean
}

export function useLegalContractSignatures(options: UseLegalContractSignaturesOptions) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getLegalContractSignaturesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
