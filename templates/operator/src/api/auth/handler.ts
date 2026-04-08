/**
 * Better Auth handler for Hono.
 *
 * Mounts Better Auth at /auth/* for authentication operations.
 * Same-origin — no CORS needed. Session cookies work naturally.
 *
 * Also provides /auth/status (user provisioning) and /auth/me (user info).
 */

import { createBetterAuth } from "@voyantjs/auth/server"
import { authUser, userProfilesTable } from "@voyantjs/db/schema/iam"
import type { VoyantPermission, VoyantRequestAuthContext } from "@voyantjs/hono"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { Resend } from "resend"

import { getDbFromHyperdrive } from "../lib/db"

const auth = new Hono<{ Bindings: CloudflareBindings }>()
const DEFAULT_APP_URL = "http://localhost:3300"

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "")
}

function getAppUrl(env: CloudflareBindings): string {
  const candidates = [
    env.APP_URL,
    env.DASH_BASE_URL,
    env.CORS_ALLOWLIST?.split(",")[0],
    DEFAULT_APP_URL,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return normalizeUrl(candidate)
    }
  }

  return DEFAULT_APP_URL
}

function getTrustedOrigins(env: CloudflareBindings): string[] {
  return Array.from(
    new Set(
      [env.APP_URL, env.DASH_BASE_URL, ...(env.CORS_ALLOWLIST ?? "").split(",")]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).map(normalizeUrl)
}

function getAuthBaseUrl(env: CloudflareBindings): string {
  // entry.ts strips /api before delegating to the Hono app, so Better Auth
  // sees paths like /auth/*. Its baseURL must be the origin only (no /api).
  const appUrl = getAppUrl(env)
  try {
    const parsed = new URL(appUrl)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return appUrl
  }
}

/**
 * Create a fresh Better Auth instance per request.
 *
 * Cloudflare Workers isolate I/O per request — a DB connection created in
 * one request cannot be reused by another ("Cannot perform I/O on behalf of
 * a different request"). So we must NOT cache the auth instance.
 */
function getBetterAuth(env: CloudflareBindings) {
  const db = getDbFromHyperdrive(env)
  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null
  const emailFrom = env.EMAIL_FROM || "Voyant <noreply@voyantcloud.app>"
  const appUrl = getAppUrl(env)

  return createBetterAuth({
    db,
    secret: env.SESSION_CLAIMS_SECRET,
    baseURL: getAuthBaseUrl(env),
    basePath: "/auth",
    trustedOrigins: getTrustedOrigins(env),
    sendResetPassword: resend
      ? async ({ user, url }) => {
          await resend.emails.send({
            from: emailFrom,
            to: user.email,
            subject: "Reset your password",
            html: `<p>Hi ${user.name},</p><p>Click <a href="${url}">here</a> to reset your password.</p><p>If you didn't request this, you can safely ignore this email.</p>`,
          })
        }
      : undefined,
    sendVerificationOTP: resend
      ? async ({ email, otp, type }) => {
          await resend.emails.send({
            from: emailFrom,
            to: email,
            subject: type === "email-verification" ? "Verify your email" : "Your verification code",
            html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
          })
        }
      : undefined,
    sendInvitationEmail: resend
      ? async (data) => {
          const acceptUrl = `${appUrl}/accept-invitation?id=${data.id}`
          await resend.emails.send({
            from: emailFrom,
            to: data.email,
            subject: `Join ${data.organization.name} on Voyant`,
            html: `<p>${data.inviter.user.name} invited you to join <strong>${data.organization.name}</strong>.</p><p><a href="${acceptUrl}">Accept invitation</a></p>`,
          })
        }
      : undefined,
  })
}

export async function resolveAuthRequest(
  request: Request,
  env: CloudflareBindings,
): Promise<VoyantRequestAuthContext | null> {
  const betterAuth = getBetterAuth(env)
  const session = await betterAuth.api.getSession({ headers: request.headers })

  if (!session) {
    return null
  }

  return {
    userId: session.user.id,
    sessionId: session.session.id,
    organizationId: session.session.activeOrganizationId ?? null,
    callerType: "session",
    email: session.user.email ?? null,
  }
}

export async function hasAuthPermission(
  request: Request,
  env: CloudflareBindings,
  permission: VoyantPermission,
): Promise<boolean> {
  const betterAuth = getBetterAuth(env)
  const result = await betterAuth.api.hasPermission({
    headers: request.headers,
    body: { permissions: { [permission.resource]: [permission.action] } },
  })

  return Boolean(result?.success)
}

/**
 * GET /auth/me
 * Returns the current authenticated user's profile.
 * Validates the session cookie directly (no Bearer token needed).
 */
auth.get("/auth/me", async (c) => {
  const betterAuth = getBetterAuth(c.env)
  const session = await betterAuth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const db = getDbFromHyperdrive(c.env)

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
    .where(eq(authUser.id, session.user.id))
    .limit(1)

  if (!row) {
    return c.json({ error: "User not found" }, 404)
  }

  return c.json({
    id: row.id,
    email: row.email,
    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    isSuperAdmin: row.isSuperAdmin ?? false,
    isSupportUser: row.isSupportUser ?? false,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    profilePictureUrl: row.avatarUrl ?? null,
    activeOrganizationId: session.session.activeOrganizationId ?? null,
  })
})

/**
 * GET /auth/status
 * Ensures the authenticated user has a user_profiles row.
 * Profile is normally created by the BA databaseHook on sign-up,
 * but this route serves as an idempotent fallback.
 */
auth.get("/auth/status", async (c) => {
  const betterAuth = getBetterAuth(c.env)
  const session = await betterAuth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ userExists: false, authenticated: false })
  }

  const userId = session.user.id
  const db = getDbFromHyperdrive(c.env)

  try {
    const [existingProfile] = await db
      .select({ id: userProfilesTable.id })
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, userId))
      .limit(1)

    if (existingProfile) {
      return c.json({ userExists: true, authenticated: true })
    }

    // Profile doesn't exist yet — create from BA user data
    const [baUser] = await db
      .select({ name: authUser.name, email: authUser.email, image: authUser.image })
      .from(authUser)
      .where(eq(authUser.id, userId))
      .limit(1)

    if (!baUser?.email) {
      return c.json(
        { userExists: false, authenticated: true, reason: `No email found for user ${userId}.` },
        400,
      )
    }

    const nameParts = baUser.name?.split(" ") ?? []
    const firstName = nameParts[0] ?? null
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null

    await db
      .insert(userProfilesTable)
      .values({ id: userId, firstName, lastName, avatarUrl: baUser.image ?? null })
      .onConflictDoNothing()

    return c.json({ userExists: true, authenticated: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[auth/status] Error:", message)
    return c.json(
      { userExists: false, authenticated: true, reason: `Provisioning error: ${message}` },
      500,
    )
  }
})

/**
 * Catch-all: delegate to Better Auth handler.
 * Handles sign-in, sign-up, sign-out, password reset, OAuth callbacks, etc.
 */
auth.all("/auth/*", async (c) => {
  const betterAuth = getBetterAuth(c.env)

  // Better Auth expects the path relative to its basePath.
  // Our mount point is /auth, so the request URL already matches.
  const response = await betterAuth.handler(c.req.raw)
  return response
})

export default auth
