"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantLegalContext } from "../provider.js"
import type { LegalContractTemplatesListFilters } from "../query-keys.js"
import { getLegalContractTemplatesQueryOptions } from "../query-options.js"

export interface UseLegalContractTemplatesOptions extends LegalContractTemplatesListFilters {
  enabled?: boolean
}

export function useLegalContractTemplates(options: UseLegalContractTemplatesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getLegalContractTemplatesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
