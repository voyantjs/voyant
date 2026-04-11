"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantIdentityContext } from "../provider.js"
import type { AddressesListFilters } from "../query-keys.js"
import { getAddressesQueryOptions } from "../query-options.js"

export interface UseAddressesOptions extends AddressesListFilters {
  enabled?: boolean
}

export function useAddresses(options: UseAddressesOptions = {}) {
  const { baseUrl, fetcher } = useVoyantIdentityContext()
  const { enabled = true, ...filters } = options

  return useQuery({
    ...getAddressesQueryOptions({ baseUrl, fetcher }, filters),
    enabled,
  })
}
