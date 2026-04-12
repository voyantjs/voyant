"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantAuthContext } from "../provider.js"
import { authQueryKeys } from "../query-keys.js"
import {
  organizationMemberSchema,
  organizationRemoveMemberSchema,
  type organizationRoleSchema,
} from "../schemas.js"

export interface UpdateOrganizationMemberRoleInput {
  memberId: string
  role: z.input<typeof organizationRoleSchema>
  organizationId?: string | undefined
}

export interface RemoveOrganizationMemberInput {
  memberIdOrEmail: string
  organizationId?: string | undefined
}

export function useOrganizationMemberMutation() {
  const { baseUrl, fetcher } = useVoyantAuthContext()
  const queryClient = useQueryClient()

  const updateRole = useMutation({
    mutationFn: async (input: UpdateOrganizationMemberRoleInput) =>
      fetchWithValidation(
        "/auth/organization/update-member-role",
        organizationMemberSchema,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.organizationMembers() })
    },
  })

  const remove = useMutation({
    mutationFn: async (input: RemoveOrganizationMemberInput) =>
      fetchWithValidation(
        "/auth/organization/remove-member",
        organizationRemoveMemberSchema,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.organizationMembers() })
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.currentWorkspace() })
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser() })
    },
  })

  return { updateRole, remove }
}
