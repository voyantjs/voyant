"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantAuthContext } from "../provider.js"
import type { OrganizationMembersListFilters } from "../query-keys.js"
import { getOrganizationMembersQueryOptions } from "../query-options.js"

export interface UseOrganizationMembersOptions {
  filters?: OrganizationMembersListFilters
  enabled?: boolean
}

export function useOrganizationMembers(options: UseOrganizationMembersOptions = {}) {
  const { baseUrl, fetcher } = useVoyantAuthContext()
  const { filters = {}, enabled = true } = options

  return useQuery({
    ...getOrganizationMembersQueryOptions(filters, { baseUrl, fetcher }),
    enabled,
  })
}
