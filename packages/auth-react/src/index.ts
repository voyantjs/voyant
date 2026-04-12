export type {
  AuthStatus,
  CurrentUser,
  CurrentWorkspace,
  WorkspaceOrganization,
} from "@voyantjs/auth/workspace"
export {
  defaultFetcher,
  fetchWithValidation,
  VoyantApiError,
  type VoyantFetcher,
  withQueryParams,
} from "./client.js"
export * from "./hooks/index.js"
export {
  useVoyantAuthContext,
  type VoyantAuthContextValue,
  VoyantAuthProvider,
  type VoyantAuthProviderProps,
} from "./provider.js"
export type {
  OrganizationInvitationsListFilters,
  OrganizationMembersListFilters,
} from "./query-keys.js"
export { authQueryKeys } from "./query-keys.js"
export {
  getAuthStatusQueryOptions,
  getCurrentUserQueryOptions,
  getCurrentWorkspaceQueryOptions,
  getOrganizationInvitationsQueryOptions,
  getOrganizationMembersQueryOptions,
} from "./query-options.js"
export * from "./schemas.js"
