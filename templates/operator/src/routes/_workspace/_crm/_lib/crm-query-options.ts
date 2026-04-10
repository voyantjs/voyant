import { queryOptions } from "@tanstack/react-query"
import type {
  ActivityRecord,
  OpportunitiesListFilters,
  OpportunityRecord,
  OrganizationRecord,
  OrganizationsListFilters,
  PeopleListFilters,
  PersonRecord,
} from "@voyantjs/crm-react"
import { crmQueryKeys } from "@voyantjs/crm-react"
import { api } from "@/lib/api-client"

type PaginatedResponse<T> = {
  data: T[]
  total: number
  limit: number
  offset: number
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

export function getPersonQueryOptions(id: string) {
  return queryOptions({
    queryKey: crmQueryKeys.person(id),
    queryFn: async () => {
      const response = await api.get<{ data: PersonRecord }>(`/v1/crm/people/${id}`)
      return response.data
    },
  })
}

export function getPersonNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["person-notes", id],
    queryFn: () => api.get<PaginatedResponse<{ id: string }>>(`/v1/crm/people/${id}/notes`),
  })
}

export function getPersonActivitiesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["person-activities", id],
    queryFn: () =>
      api.get<PaginatedResponse<ActivityRecord>>(
        `/v1/crm/activities?entityType=person&entityId=${id}&limit=50`,
      ),
  })
}

export function getPersonOpportunitiesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["person-opportunities", id],
    queryFn: () =>
      api.get<PaginatedResponse<OpportunityRecord>>(
        `/v1/crm/opportunities?personId=${id}&limit=20`,
      ),
  })
}

export function getOrganizationQueryOptions(id: string) {
  return queryOptions({
    queryKey: crmQueryKeys.organization(id),
    queryFn: async () => {
      const response = await api.get<{ data: OrganizationRecord }>(`/v1/crm/organizations/${id}`)
      return response.data
    },
  })
}

export function getOpportunitiesQueryOptions(filters: OpportunitiesListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.personId) params.set("personId", filters.personId)
  if (filters.organizationId) params.set("organizationId", filters.organizationId)
  if (filters.pipelineId) params.set("pipelineId", filters.pipelineId)
  if (filters.stageId) params.set("stageId", filters.stageId)
  if (filters.ownerId) params.set("ownerId", filters.ownerId)
  if (filters.status) params.set("status", filters.status)
  if (filters.limit !== undefined) params.set("limit", String(filters.limit))
  if (filters.offset !== undefined) params.set("offset", String(filters.offset))

  const qs = params.toString()
  return queryOptions({
    queryKey: crmQueryKeys.opportunitiesList(filters),
    queryFn: () =>
      api.get<PaginatedResponse<OpportunityRecord>>(`/v1/crm/opportunities${qs ? `?${qs}` : ""}`),
  })
}
