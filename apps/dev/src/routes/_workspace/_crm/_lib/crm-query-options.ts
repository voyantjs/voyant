import { queryOptions } from "@tanstack/react-query"
import type {
  ActivitiesListFilters,
  ActivityRecord,
  OrganizationRecord,
  OrganizationsListFilters,
  PeopleListFilters,
  PersonRecord,
  QuoteRecord,
  QuotesListFilters,
} from "@voyantjs/crm-react"
import { crmQueryKeys } from "@voyantjs/crm-react"
import { api } from "@/lib/api-client"

type PaginatedResponse<T> = {
  data: T[]
  total: number
  limit: number
  offset: number
}

export function getActivitiesQueryOptions(filters: ActivitiesListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.ownerId) params.set("ownerId", filters.ownerId)
  if (filters.status) params.set("status", filters.status)
  if (filters.type) params.set("type", filters.type)
  if (filters.entityType) params.set("entityType", filters.entityType)
  if (filters.entityId) params.set("entityId", filters.entityId)
  if (filters.limit !== undefined) params.set("limit", String(filters.limit))
  if (filters.offset !== undefined) params.set("offset", String(filters.offset))

  const qs = params.toString()
  return queryOptions({
    queryKey: crmQueryKeys.activitiesList(filters),
    queryFn: () =>
      api.get<PaginatedResponse<ActivityRecord>>(`/v1/crm/activities${qs ? `?${qs}` : ""}`),
  })
}

export function getOrganizationsQueryOptions(filters: OrganizationsListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.ownerId) params.set("ownerId", filters.ownerId)
  if (filters.relation) params.set("relation", filters.relation)
  if (filters.status) params.set("status", filters.status)
  if (filters.limit !== undefined) params.set("limit", String(filters.limit))
  if (filters.offset !== undefined) params.set("offset", String(filters.offset))

  const qs = params.toString()
  return queryOptions({
    queryKey: crmQueryKeys.organizationsList(filters),
    queryFn: () =>
      api.get<PaginatedResponse<OrganizationRecord>>(`/v1/crm/organizations${qs ? `?${qs}` : ""}`),
  })
}

export function getPeopleQueryOptions(filters: PeopleListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.organizationId) params.set("organizationId", filters.organizationId)
  if (filters.ownerId) params.set("ownerId", filters.ownerId)
  if (filters.relation) params.set("relation", filters.relation)
  if (filters.status) params.set("status", filters.status)
  if (filters.limit !== undefined) params.set("limit", String(filters.limit))
  if (filters.offset !== undefined) params.set("offset", String(filters.offset))

  const qs = params.toString()
  return queryOptions({
    queryKey: crmQueryKeys.peopleList(filters),
    queryFn: () => api.get<PaginatedResponse<PersonRecord>>(`/v1/crm/people${qs ? `?${qs}` : ""}`),
  })
}

export function getQuotesQueryOptions(filters: QuotesListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.opportunityId) params.set("opportunityId", filters.opportunityId)
  if (filters.status) params.set("status", filters.status)
  if (filters.limit !== undefined) params.set("limit", String(filters.limit))
  if (filters.offset !== undefined) params.set("offset", String(filters.offset))

  const qs = params.toString()
  return queryOptions({
    queryKey: crmQueryKeys.quotesList(filters),
    queryFn: () => api.get<PaginatedResponse<QuoteRecord>>(`/v1/crm/quotes${qs ? `?${qs}` : ""}`),
  })
}
