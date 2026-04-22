export interface OrganizationMembersListFilters {
  organizationId?: string
}

export interface OrganizationInvitationsListFilters {
  organizationId?: string
}

export const authQueryKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authQueryKeys.all, "current-user"] as const,
  authStatus: () => [...authQueryKeys.all, "status"] as const,
  currentWorkspace: () => [...authQueryKeys.all, "current-workspace"] as const,
  organizationMembers: (filters: OrganizationMembersListFilters = {}) =>
    [...authQueryKeys.all, "organization-members", filters] as const,
  organizationInvitations: (filters: OrganizationInvitationsListFilters = {}) =>
    [...authQueryKeys.all, "organization-invitations", filters] as const,
}
