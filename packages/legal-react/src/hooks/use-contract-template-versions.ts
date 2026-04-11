"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantLegalContext } from "../provider.js"
import { getLegalContractTemplateVersionsQueryOptions } from "../query-options.js"

export interface UseLegalContractTemplateVersionsOptions {
  templateId: string
  enabled?: boolean
}

export function useLegalContractTemplateVersions(options: UseLegalContractTemplateVersionsOptions) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getLegalContractTemplateVersionsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
