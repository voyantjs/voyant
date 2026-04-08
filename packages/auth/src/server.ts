import { apiKey } from "@better-auth/api-key"
import { getDb } from "@voyantjs/db"
import {
  apikeyTable,
  authAccount,
  authInvitation,
  authMember,
  authOrganization,
  authSession,
  authUser,
  authVerification,
  userProfilesTable,
} from "@voyantjs/db/schema/iam"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP, organization } from "better-auth/plugins"
import type { BetterAuthPlugin } from "better-auth/types"

import { ac, roles } from "./permissions"

export function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.SESSION_CLAIMS_SECRET || ""

  if (!secret || secret.length < 32) {
    // During build, env vars may not be available.
    // Return a placeholder so module-level initialization succeeds.
    if (typeof process.env.NEXT_PHASE === "string") {
      return "build-phase-placeholder-secret-not-used-at-runtime!!"
    }
    throw new Error(
      "Missing BETTER_AUTH_SECRET (or SESSION_CLAIMS_SECRET) with at least 32 characters",
    )
  }

  return secret
}

function getTrustedOrigins(): string[] {
  const values = [
    process.env.BETTER_AUTH_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VOYANT_DASHBOARD_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.ADMIN_URL,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0)

  return Array.from(new Set(values.map((value) => value.trim().replace(/\/$/, ""))))
}

export interface CreateBetterAuthOptions {
  db?: ReturnType<typeof getDb>
  secret?: string
  baseURL?: string
  basePath?: string
  trustedOrigins?: string[]
  plugins?: BetterAuthPlugin[]
  /** Called when a user requests a password reset. If not provided, logs to console. */
  sendResetPassword?: (data: {
    user: { email: string; name: string }
    url: string
    token: string
  }) => Promise<void>
  /** Called to send a verification OTP. If not provided, logs to console. */
  sendVerificationOTP?: (data: { email: string; otp: string; type: string }) => Promise<void>
  /** Called to send an organization invitation email. If not provided, logs to console. */
  sendInvitationEmail?: (
    data: {
      id: string
      role: string
      email: string
      organization: {
        id: string
        name: string
        slug: string
        createdAt: Date
        logo?: string | null
        metadata?: Record<string, unknown> | string
      }
      invitation: {
        id: string
        organizationId: string
        email: string
        role: string
        status: "pending" | "accepted" | "rejected" | "canceled"
        expiresAt: Date
        inviterId: string
        createdAt: Date
        teamId?: string | null
      }
      inviter: {
        id: string
        organizationId: string
        userId: string
        role: string
        createdAt: Date
      } & { user: { id: string; name: string; email: string; image?: string | null } }
    },
    request?: Request,
  ) => Promise<void>
}

/**
 * Framework-agnostic Better Auth factory.
 *
 * Accepts optional overrides for db, secret, baseURL, trustedOrigins.
 * Does NOT depend on Next.js — safe to use in Hono workers, TanStack Start, etc.
 */
export function createBetterAuth(options: CreateBetterAuthOptions = {}) {
  const db = options.db ?? getDb("edge")
  const secret = options.secret ?? getAuthSecret()
  const baseURL =
    options.baseURL ??
    process.env.BETTER_AUTH_URL ??
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  const trustedOrigins = options.trustedOrigins ?? getTrustedOrigins()
  const extraPlugins = options.plugins ?? []

  return betterAuth({
    appName: "Voyant",
    baseURL,
    ...(options.basePath ? { basePath: options.basePath } : {}),
    secret,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: authUser,
        session: authSession,
        account: authAccount,
        verification: authVerification,
        apikey: apikeyTable,
        organization: authOrganization,
        member: authMember,
        invitation: authInvitation,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      // eslint-disable-next-line @typescript-eslint/require-await
      sendResetPassword:
        options.sendResetPassword ??
        (async ({ user, url }) => {
          console.warn(
            `[Auth] No email provider configured — password reset for ${user.email}: ${url}`,
          )
        }),
    },
    emailVerification: {
      sendOnSignUp: false, // OTP plugin handles this
      autoSignInAfterVerification: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
    },
    trustedOrigins,
    plugins: [
      apiKey({
        defaultPrefix: "voy_",
        apiKeyHeaders: ["authorization"],
        references: "organization",
      }),
      organization({
        ac,
        roles,
        // eslint-disable-next-line @typescript-eslint/require-await
        sendInvitationEmail:
          options.sendInvitationEmail ??
          (async (data) => {
            console.warn(`[Auth] Invitation for ${data.email} to org ${data.organization.name}`)
          }),
      }),
      emailOTP({
        // eslint-disable-next-line @typescript-eslint/require-await
        sendVerificationOTP:
          options.sendVerificationOTP ??
          (async ({ email, otp, type }) => {
            console.warn(`[Auth] OTP for ${email}: ${otp} (${type})`)
          }),
        otpLength: 6,
        expiresIn: 600,
        sendVerificationOnSignUp: true,
      }),
      ...extraPlugins,
    ],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const nameParts = user.name?.split(" ") ?? []
            const firstName = nameParts[0] ?? null
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null

            await db
              .insert(userProfilesTable)
              .values({
                id: user.id,
                firstName,
                lastName,
                avatarUrl: user.image ?? null,
              })
              .onConflictDoNothing()
          },
        },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
    },
  })
}
