export interface OrganizationMembersListFilters {
  limit?: number | string | undefined
  offset?: number | string | undefined
  sortBy?: string | undefined
  sortDirection?: "asc" | "desc" | undefined
  filterField?: string | undefined
  filterValue?: string | number | boolean | Array<string | number> | undefined
  filterOperator?:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "not_in"
    | "contains"
    | "starts_with"
    | "ends_with"
    | undefined
  organizationId?: string | undefined
  organizationSlug?: string | undefined
}

export interface OrganizationInvitationsListFilters {
  organizationId?: string | undefined
}

export const authQueryKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authQueryKeys.all, "current-user"] as const,
  currentWorkspace: () => [...authQueryKeys.all, "current-workspace"] as const,
  authStatus: () => [...authQueryKeys.all, "status"] as const,
  organizationMembers: () => [...authQueryKeys.all, "organization-members"] as const,
  organizationMembersList: (filters: OrganizationMembersListFilters = {}) =>
    [...authQueryKeys.organizationMembers(), "list", filters] as const,
  organizationInvitations: () => [...authQueryKeys.all, "organization-invitations"] as const,
  organizationInvitationsList: (filters: OrganizationInvitationsListFilters = {}) =>
    [...authQueryKeys.organizationInvitations(), "list", filters] as const,
}
