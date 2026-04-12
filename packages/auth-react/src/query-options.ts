"use client"

import { queryOptions } from "@tanstack/react-query"

import { type FetchWithValidationOptions, fetchWithValidation, withQueryParams } from "./client.js"
import {
  authQueryKeys,
  type OrganizationInvitationsListFilters,
  type OrganizationMembersListFilters,
} from "./query-keys.js"
import {
  authStatusSchema,
  currentUserSchema,
  currentWorkspaceSchema,
  organizationInvitationsListSchema,
  organizationMembersListSchema,
} from "./schemas.js"

export function getCurrentUserQueryOptions(client: FetchWithValidationOptions) {
  return queryOptions({
    queryKey: authQueryKeys.currentUser(),
    queryFn: () => fetchWithValidation("/auth/me", currentUserSchema, client),
  })
}

export function getCurrentWorkspaceQueryOptions(client: FetchWithValidationOptions) {
  return queryOptions({
    queryKey: authQueryKeys.currentWorkspace(),
    queryFn: () => fetchWithValidation("/auth/workspace", currentWorkspaceSchema, client),
  })
}

export function getAuthStatusQueryOptions(client: FetchWithValidationOptions) {
  return queryOptions({
    queryKey: authQueryKeys.authStatus(),
    queryFn: () => fetchWithValidation("/auth/status", authStatusSchema, client),
  })
}

export function getOrganizationMembersQueryOptions(
  filters: OrganizationMembersListFilters,
  client: FetchWithValidationOptions,
) {
  return queryOptions({
    queryKey: authQueryKeys.organizationMembersList(filters),
    queryFn: () =>
      fetchWithValidation(
        withQueryParams("/auth/organization/list-members", filters),
        organizationMembersListSchema,
        client,
      ),
  })
}

export function getOrganizationInvitationsQueryOptions(
  filters: OrganizationInvitationsListFilters,
  client: FetchWithValidationOptions,
) {
  return queryOptions({
    queryKey: authQueryKeys.organizationInvitationsList(filters),
    queryFn: () =>
      fetchWithValidation(
        withQueryParams("/auth/organization/list-invitations", filters),
        organizationInvitationsListSchema,
        client,
      ),
  })
}

export type {
  OrganizationInvitationsListFilters,
  OrganizationMembersListFilters,
} from "./query-keys.js"
