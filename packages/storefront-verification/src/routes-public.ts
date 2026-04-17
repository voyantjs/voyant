import { parseJsonBody } from "@voyantjs/hono"
import type { NotificationProvider } from "@voyantjs/notifications"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import {
  createStorefrontVerificationSendersFromProviders,
  createStorefrontVerificationService,
  StorefrontVerificationError,
  type StorefrontVerificationProviderOptions,
  type StorefrontVerificationSenders,
  type StorefrontVerificationServiceOptions,
} from "./service.js"
import {
  confirmEmailVerificationChallengeSchema,
  confirmSmsVerificationChallengeSchema,
  startEmailVerificationChallengeSchema,
  startSmsVerificationChallengeSchema,
} from "./validation.js"

type Env = {
  Bindings: Record<string, unknown>
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export interface StorefrontVerificationRoutesOptions
  extends StorefrontVerificationServiceOptions,
    StorefrontVerificationProviderOptions {
  sendEmailChallenge?: StorefrontVerificationSenders["sendEmailChallenge"]
  sendSmsChallenge?: StorefrontVerificationSenders["sendSmsChallenge"]
  providers?: ReadonlyArray<NotificationProvider>
  resolveProviders?: (bindings: Record<string, unknown>) => ReadonlyArray<NotificationProvider>
}

function getSenders(
  bindings: Record<string, unknown>,
  options?: StorefrontVerificationRoutesOptions,
): StorefrontVerificationSenders {
  const senders: StorefrontVerificationSenders = {
    sendEmailChallenge: options?.sendEmailChallenge,
    sendSmsChallenge: options?.sendSmsChallenge,
  }

  if (!senders.sendEmailChallenge || !senders.sendSmsChallenge) {
    const providers = options?.resolveProviders?.(bindings) ?? options?.providers
    if (providers?.length) {
      const providerSenders = createStorefrontVerificationSendersFromProviders(providers, options)
      senders.sendEmailChallenge ??= providerSenders.sendEmailChallenge
      senders.sendSmsChallenge ??= providerSenders.sendSmsChallenge
    }
  }

  return senders
}

function errorResponse(error: unknown) {
  if (error instanceof StorefrontVerificationError) {
    if (error.code === "sender_not_configured") {
      return { status: 501 as const, body: { error: error.message, code: error.code } }
    }

    if (error.code === "challenge_not_found") {
      return { status: 404 as const, body: { error: error.message, code: error.code } }
    }

    if (error.code === "challenge_expired") {
      return { status: 410 as const, body: { error: error.message, code: error.code } }
    }

    if (error.code === "challenge_invalid" || error.code === "challenge_failed") {
      return { status: 409 as const, body: { error: error.message, code: error.code } }
    }
  }

  const message = error instanceof Error ? error.message : "Verification request failed"
  return { status: 400 as const, body: { error: message } }
}

export function createStorefrontVerificationPublicRoutes(
  options?: StorefrontVerificationRoutesOptions,
) {
  const service = createStorefrontVerificationService(options)

  return new Hono<Env>()
    .post("/email/start", async (c) => {
      try {
        const result = await service.startEmailChallenge(
          c.get("db"),
          await parseJsonBody(c, startEmailVerificationChallengeSchema),
          getSenders(c.env, options),
        )
        return c.json({ data: result }, 201)
      } catch (error) {
        const response = errorResponse(error)
        return c.json(response.body, response.status)
      }
    })
    .post("/email/confirm", async (c) => {
      try {
        const result = await service.confirmEmailChallenge(
          c.get("db"),
          await parseJsonBody(c, confirmEmailVerificationChallengeSchema),
        )
        return c.json({ data: result })
      } catch (error) {
        const response = errorResponse(error)
        return c.json(response.body, response.status)
      }
    })
    .post("/sms/start", async (c) => {
      try {
        const result = await service.startSmsChallenge(
          c.get("db"),
          await parseJsonBody(c, startSmsVerificationChallengeSchema),
          getSenders(c.env, options),
        )
        return c.json({ data: result }, 201)
      } catch (error) {
        const response = errorResponse(error)
        return c.json(response.body, response.status)
      }
    })
    .post("/sms/confirm", async (c) => {
      try {
        const result = await service.confirmSmsChallenge(
          c.get("db"),
          await parseJsonBody(c, confirmSmsVerificationChallengeSchema),
        )
        return c.json({ data: result })
      } catch (error) {
        const response = errorResponse(error)
        return c.json(response.body, response.status)
      }
    })
}

export type StorefrontVerificationPublicRoutes = ReturnType<
  typeof createStorefrontVerificationPublicRoutes
>
