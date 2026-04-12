import { z } from "zod"

export const organizationRoleSchema = z.union([z.string(), z.array(z.string())])

export const organizationInvitationStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "canceled",
])

export const workspaceOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable().optional(),
})

export const currentWorkspaceSchema = z.object({
  organizations: z.array(workspaceOrganizationSchema),
  activeOrganization: workspaceOrganizationSchema.nullable(),
})

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  isSuperAdmin: z.boolean(),
  isSupportUser: z.boolean(),
  createdAt: z.string(),
  profilePictureUrl: z.string().nullable().optional(),
  activeOrganizationId: z.string().nullable().optional(),
})

export const authStatusSchema = z.object({
  userExists: z.boolean(),
  authenticated: z.boolean(),
  reason: z.string().optional(),
})

export const organizationMemberUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
})

export const organizationMemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: organizationRoleSchema,
  createdAt: z.string(),
  teamId: z.string().optional(),
  user: organizationMemberUserSchema,
})

export const organizationMembersListSchema = z.object({
  members: z.array(organizationMemberSchema),
  total: z.number(),
})

export const organizationRemoveMemberSchema = z.object({
  member: organizationMemberSchema,
})

export const organizationInvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: organizationRoleSchema,
  status: organizationInvitationStatusSchema,
  inviterId: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
  teamId: z.string().optional(),
})

export const organizationInvitationsListSchema = z.array(organizationInvitationSchema)
