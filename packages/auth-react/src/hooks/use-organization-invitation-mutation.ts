"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantAuthContext } from "../provider.js"
import { authQueryKeys } from "../query-keys.js"
import { organizationInvitationSchema, type organizationRoleSchema } from "../schemas.js"

export interface InviteOrganizationMemberInput {
  email: string
  role: z.input<typeof organizationRoleSchema>
  organizationId?: string | undefined
  resend?: boolean | undefined
}

export interface CancelOrganizationInvitationInput {
  invitationId: string
}

export function useOrganizationInvitationMutation() {
  const { baseUrl, fetcher } = useVoyantAuthContext()
  const queryClient = useQueryClient()

  const invite = useMutation({
    mutationFn: async (input: InviteOrganizationMemberInput) =>
      fetchWithValidation(
        "/auth/organization/invite-member",
        organizationInvitationSchema,
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.organizationInvitations() })
    },
  })

  const cancel = useMutation({
    mutationFn: async (input: CancelOrganizationInvitationInput) =>
      fetchWithValidation(
        "/auth/organization/cancel-invitation",
        organizationInvitationSchema.nullable(),
        { baseUrl, fetcher },
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.organizationInvitations() })
    },
  })

  return { invite, cancel }
}
