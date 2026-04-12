import type { getDb } from "@voyantjs/db"
import {
  authMember,
  authOrganization,
  authSession,
  authUser,
  userProfilesTable,
} from "@voyantjs/db/schema/iam"
import { and, asc, eq } from "drizzle-orm"

type WorkspaceDb = ReturnType<typeof getDb>

export type WorkspaceOrganization = {
  id: string
  name: string
  slug: string
  logo?: string | null
}

export type CurrentWorkspace = {
  organizations: WorkspaceOrganization[]
  activeOrganization: WorkspaceOrganization | null
}

export type CurrentUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  isSuperAdmin: boolean
  isSupportUser: boolean
  createdAt: string
  profilePictureUrl?: string | null
  activeOrganizationId?: string | null
}

export type AuthStatus = {
  userExists: boolean
  authenticated: boolean
  reason?: string
}

export async function listWorkspaceOrganizations(
  db: WorkspaceDb,
  userId: string,
): Promise<WorkspaceOrganization[]> {
  return db
    .select({
      id: authOrganization.id,
      name: authOrganization.name,
      slug: authOrganization.slug,
      logo: authOrganization.logo,
    })
    .from(authMember)
    .innerJoin(authOrganization, eq(authOrganization.id, authMember.organizationId))
    .where(eq(authMember.userId, userId))
    .orderBy(asc(authOrganization.createdAt))
}

export async function getCurrentWorkspace(
  db: WorkspaceDb,
  input: {
    sessionId: string
    userId: string
    activeOrganizationId: string | null
  },
): Promise<CurrentWorkspace> {
  const organizations = await listWorkspaceOrganizations(db, input.userId)

  if (organizations.length === 0) {
    return {
      organizations,
      activeOrganization: null,
    }
  }

  let activeOrganizationId =
    organizations.find((organization) => organization.id === input.activeOrganizationId)?.id ?? null

  if (!activeOrganizationId) {
    activeOrganizationId = organizations[0]?.id ?? null

    if (activeOrganizationId) {
      await db
        .update(authSession)
        .set({ activeOrganizationId, updatedAt: new Date() })
        .where(eq(authSession.id, input.sessionId))
    }
  }

  return {
    organizations,
    activeOrganization:
      organizations.find((organization) => organization.id === activeOrganizationId) ?? null,
  }
}

export async function setActiveWorkspaceOrganization(
  db: WorkspaceDb,
  input: {
    sessionId: string
    userId: string
    organizationId: string
  },
): Promise<CurrentWorkspace | null> {
  const [membership] = await db
    .select({ id: authOrganization.id })
    .from(authMember)
    .innerJoin(authOrganization, eq(authOrganization.id, authMember.organizationId))
    .where(
      and(eq(authMember.userId, input.userId), eq(authMember.organizationId, input.organizationId)),
    )
    .limit(1)

  if (!membership) {
    return null
  }

  await db
    .update(authSession)
    .set({ activeOrganizationId: input.organizationId, updatedAt: new Date() })
    .where(eq(authSession.id, input.sessionId))

  return getCurrentWorkspace(db, {
    sessionId: input.sessionId,
    userId: input.userId,
    activeOrganizationId: input.organizationId,
  })
}

export async function getCurrentUser(
  db: WorkspaceDb,
  input: {
    userId: string
    activeOrganizationId: string | null
  },
): Promise<CurrentUser | null> {
  const [row] = await db
    .select({
      id: authUser.id,
      email: authUser.email,
      createdAt: authUser.createdAt,
      firstName: userProfilesTable.firstName,
      lastName: userProfilesTable.lastName,
      avatarUrl: userProfilesTable.avatarUrl,
      isSuperAdmin: userProfilesTable.isSuperAdmin,
      isSupportUser: userProfilesTable.isSupportUser,
    })
    .from(authUser)
    .leftJoin(userProfilesTable, eq(userProfilesTable.id, authUser.id))
    .where(eq(authUser.id, input.userId))
    .limit(1)

  if (!row) {
    return null
  }

  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    isSuperAdmin: row.isSuperAdmin ?? false,
    isSupportUser: row.isSupportUser ?? false,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    profilePictureUrl: row.avatarUrl ?? null,
    activeOrganizationId: input.activeOrganizationId,
  }
}

export async function ensureCurrentUserProfile(
  db: WorkspaceDb,
  userId: string,
): Promise<AuthStatus> {
  try {
    const [existingProfile] = await db
      .select({ id: userProfilesTable.id })
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, userId))
      .limit(1)

    if (existingProfile) {
      return { userExists: true, authenticated: true }
    }

    const [user] = await db
      .select({ name: authUser.name, email: authUser.email, image: authUser.image })
      .from(authUser)
      .where(eq(authUser.id, userId))
      .limit(1)

    if (!user?.email) {
      return {
        userExists: false,
        authenticated: true,
        reason: `No email found for user ${userId}.`,
      }
    }

    const nameParts = user.name?.split(" ") ?? []
    const firstName = nameParts[0] ?? null
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null

    await db
      .insert(userProfilesTable)
      .values({ id: userId, firstName, lastName, avatarUrl: user.image ?? null })
      .onConflictDoNothing()

    return { userExists: true, authenticated: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return {
      userExists: false,
      authenticated: true,
      reason: `Provisioning error: ${message}`,
    }
  }
}
