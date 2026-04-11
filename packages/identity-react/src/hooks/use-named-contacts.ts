"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantIdentityContext } from "../provider.js"
import type { NamedContactsListFilters } from "../query-keys.js"
import { getNamedContactsQueryOptions } from "../query-options.js"

export interface UseNamedContactsOptions extends NamedContactsListFilters {
  enabled?: boolean
}

export function useNamedContacts(options: UseNamedContactsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantIdentityContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getNamedContactsQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
