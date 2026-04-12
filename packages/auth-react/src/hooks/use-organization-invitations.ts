"use client"

import { useQuery } from "@tanstack/react-query"

import { useVoyantAuthContext } from "../provider.js"
import type { OrganizationInvitationsListFilters } from "../query-keys.js"
import { getOrganizationInvitationsQueryOptions } from "../query-options.js"

export interface UseOrganizationInvitationsOptions {
  filters?: OrganizationInvitationsListFilters
  enabled?: boolean
}

export function useOrganizationInvitations(options: UseOrganizationInvitationsOptions = {}) {
  const { baseUrl, fetcher } = useVoyantAuthContext()
  const { filters = {}, enabled = true } = options

  return useQuery({
    ...getOrganizationInvitationsQueryOptions(filters, { baseUrl, fetcher }),
    enabled,
  })
}
