"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantLegalContext } from "../provider.js"
import { getLegalContractQueryOptions } from "../query-options.js"

export interface UseLegalContractOptions {
  enabled?: boolean
}

export function useLegalContract(id: string, options: UseLegalContractOptions = {}) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true } = options

  return useQuery({
    ...getLegalContractQueryOptions({ baseUrl, fetcher }, id),
    enabled,
  })
}
