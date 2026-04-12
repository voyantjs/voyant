"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { fetchWithValidation } from "../client.js"
import { useVoyantAuthContext } from "../provider.js"
import { authQueryKeys } from "../query-keys.js"
import { currentUserSchema, currentWorkspaceSchema } from "../schemas.js"

export function useWorkspaceMutation() {
  const { baseUrl, fetcher } = useVoyantAuthContext()
  const queryClient = useQueryClient()

  const setActiveOrganization = useMutation({
    mutationFn: async (organizationId: string) =>
      fetchWithValidation(
        "/auth/workspace/active-organization",
        currentWorkspaceSchema,
        { baseUrl, fetcher },
        {
          method: "POST",
          body: JSON.stringify({ organizationId }),
        },
      ),
    onSuccess: (workspace) => {
      queryClient.setQueryData(authQueryKeys.currentWorkspace(), workspace)
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser() })
    },
  })

  const refreshCurrentUser = useMutation({
    mutationFn: async () =>
      fetchWithValidation("/auth/me", currentUserSchema, { baseUrl, fetcher }),
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKeys.currentUser(), user)
    },
  })

  return { setActiveOrganization, refreshCurrentUser }
}
