"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantLegalContext } from "../provider.js"
import { getLegalContractAttachmentsQueryOptions } from "../query-options.js"

export interface UseLegalContractAttachmentsOptions {
  contractId: string
  enabled?: boolean
}

export function useLegalContractAttachments(options: UseLegalContractAttachmentsOptions) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getLegalContractAttachmentsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
