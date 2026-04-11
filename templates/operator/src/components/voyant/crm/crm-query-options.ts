import { queryOptions } from "@tanstack/react-query"
import {
  defaultFetcher,
  getActivitiesQueryOptions as getActivitiesQueryOptionsBase,
  getOpportunitiesQueryOptions as getOpportunitiesQueryOptionsBase,
  getOrganizationQueryOptions as getOrganizationQueryOptionsBase,
  getOrganizationsQueryOptions as getOrganizationsQueryOptionsBase,
  getPeopleQueryOptions as getPeopleQueryOptionsBase,
  getPersonActivitiesQueryOptions as getPersonActivitiesQueryOptionsBase,
  getPersonNotesQueryOptions as getPersonNotesQueryOptionsBase,
  getPersonOpportunitiesQueryOptions as getPersonOpportunitiesQueryOptionsBase,
  getPersonQueryOptions as getPersonQueryOptionsBase,
} from "@voyantjs/crm-react"
import { getApiUrl } from "@/lib/env"

const client = { baseUrl: getApiUrl(), fetcher: defaultFetcher }

export function getActivitiesQueryOptions(filters = {}) {
  return queryOptions(getActivitiesQueryOptionsBase(client, filters))
}

export function getOrganizationsQueryOptions(filters = {}) {
  return queryOptions(getOrganizationsQueryOptionsBase(client, filters))
}

export function getPeopleQueryOptions(filters = {}) {
  return queryOptions(getPeopleQueryOptionsBase(client, filters))
}

export function getPersonQueryOptions(id: string) {
  return queryOptions(getPersonQueryOptionsBase(client, id))
}

export function getPersonNotesQueryOptions(id: string) {
  return queryOptions(getPersonNotesQueryOptionsBase(client, id))
}

export function getPersonActivitiesQueryOptions(id: string) {
  return queryOptions(getPersonActivitiesQueryOptionsBase(client, id))
}

export function getPersonOpportunitiesQueryOptions(id: string) {
  return queryOptions(getPersonOpportunitiesQueryOptionsBase(client, id))
}

export function getOrganizationQueryOptions(id: string) {
  return queryOptions(getOrganizationQueryOptionsBase(client, id))
}

export function getOpportunitiesQueryOptions(filters = {}) {
  return queryOptions(getOpportunitiesQueryOptionsBase(client, filters))
}
