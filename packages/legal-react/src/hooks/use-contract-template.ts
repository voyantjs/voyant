"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantLegalContext } from "../provider.js"
import { getLegalContractTemplateQueryOptions } from "../query-options.js"

export interface UseLegalContractTemplateOptions {
  enabled?: boolean
}

export function useLegalContractTemplate(
  id: string,
  options: UseLegalContractTemplateOptions = {},
) {
  const { baseUrl, fetcher } = useVoyantLegalContext()
  const { enabled = true } = options

  return useQuery({
    ...getLegalContractTemplateQueryOptions({ baseUrl, fetcher }, id),
    enabled,
  })
}
