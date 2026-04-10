"use client"

import { queryOptions } from "@tanstack/react-query"

import { type FetchWithValidationOptions, fetchWithValidation } from "./client.js"
import type { UsePeopleOptions } from "./hooks/use-people.js"
import { crmQueryKeys } from "./query-keys.js"
import { personListResponse } from "./schemas.js"

export function getPeopleQueryOptions(
  client: FetchWithValidationOptions,
  options: UsePeopleOptions = {},
) {
  const { enabled: _enabled = true, ...filters } = options

  return queryOptions({
    queryKey: crmQueryKeys.peopleList(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.search) params.set("search", filters.search)
      if (filters.organizationId) params.set("organizationId", filters.organizationId)
      if (filters.ownerId) params.set("ownerId", filters.ownerId)
      if (filters.relation) params.set("relation", filters.relation)
      if (filters.status) params.set("status", filters.status)
      if (filters.limit !== undefined) params.set("limit", String(filters.limit))
      if (filters.offset !== undefined) params.set("offset", String(filters.offset))
      const qs = params.toString()

      return fetchWithValidation(`/v1/crm/people${qs ? `?${qs}` : ""}`, personListResponse, {
        baseUrl: client.baseUrl,
        fetcher: client.fetcher,
      })
    },
  })
}
