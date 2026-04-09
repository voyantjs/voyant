import { queryOptions } from "@tanstack/react-query"
import type {
  ActivitiesListFilters,
  ActivityRecord,
  OpportunitiesListFilters,
  OpportunityRecord,
  OrganizationRecord,
  OrganizationsListFilters,
  PeopleListFilters,
  PersonRecord,
  PipelineRecord,
  PipelinesListFilters,
  QuoteLineRecord,
  QuoteRecord,
  QuotesListFilters,
  StageRecord,
  StagesListFilters,
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

export function getPersonQueryOptions(id: string) {
  return queryOptions({
    queryKey: crmQueryKeys.person(id),
    queryFn: async () => {
      const response = await api.get<{ data: PersonRecord }>(`/v1/crm/people/${id}`)
      return response.data
    },
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

export function getQuoteQueryOptions(id: string) {
  return queryOptions({
    queryKey: crmQueryKeys.quote(id),
    queryFn: async () => {
      const response = await api.get<{ data: QuoteRecord }>(`/v1/crm/quotes/${id}`)
      return response.data
    },
  })
}

export function getQuoteLinesQueryOptions(quoteId: string) {
  return queryOptions({
    queryKey: crmQueryKeys.quoteLines(quoteId),
    queryFn: async () => {
      const response = await api.get<{ data: QuoteLineRecord[] }>(`/v1/crm/quotes/${quoteId}/lines`)
      return response.data
    },
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

export function getPipelinesQueryOptions(filters: PipelinesListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.entityType) params.set("entityType", filters.entityType)
  if (filters.limit !== undefined) params.set("limit", String(filters.limit))
  if (filters.offset !== undefined) params.set("offset", String(filters.offset))

  const qs = params.toString()
  return queryOptions({
    queryKey: crmQueryKeys.pipelinesList(filters),
    queryFn: () =>
      api.get<PaginatedResponse<PipelineRecord>>(`/v1/crm/pipelines${qs ? `?${qs}` : ""}`),
  })
}

export function getPipelineQueryOptions(id: string) {
  return queryOptions({
    queryKey: crmQueryKeys.pipeline(id),
    queryFn: async () => {
      const response = await api.get<{ data: PipelineRecord }>(`/v1/crm/pipelines/${id}`)
      return response.data
    },
  })
}

export function getStagesQueryOptions(filters: StagesListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.pipelineId) params.set("pipelineId", filters.pipelineId)
  if (filters.limit !== undefined) params.set("limit", String(filters.limit))
  if (filters.offset !== undefined) params.set("offset", String(filters.offset))

  const qs = params.toString()
  return queryOptions({
    queryKey: crmQueryKeys.stagesList(filters),
    queryFn: () => api.get<PaginatedResponse<StageRecord>>(`/v1/crm/stages${qs ? `?${qs}` : ""}`),
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

export function getOpportunityQueryOptions(id: string) {
  return queryOptions({
    queryKey: crmQueryKeys.opportunity(id),
    queryFn: async () => {
      const response = await api.get<{ data: OpportunityRecord }>(`/v1/crm/opportunities/${id}`)
      return response.data
    },
  })
}
