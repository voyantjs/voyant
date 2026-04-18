import type { ModuleContainer } from "@voyantjs/core"
import { ForbiddenApiError, handleApiError, UnauthorizedApiError } from "@voyantjs/hono"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { Context } from "hono"

import { createTransactionPiiService } from "./pii.js"
import {
  buildTransactionsRouteRuntime,
  TRANSACTIONS_ROUTE_RUNTIME_CONTAINER_KEY,
  type TransactionsRouteRuntime,
} from "./route-runtime.js"
import { transactionPiiAccessLog } from "./schema.js"

export type KmsBindings = Partial<{
  KMS_PROVIDER: string
  KMS_ENV_KEY: string
  KMS_LOCAL_KEY: string
  GCP_PROJECT_ID: string
  GCP_SERVICE_ACCOUNT_EMAIL: string
  GCP_PRIVATE_KEY: string
  GCP_KMS_KEYRING: string
  GCP_KMS_LOCATION: string
  GCP_KMS_PEOPLE_KEY_NAME: string
  GCP_KMS_INTEGRATIONS_KEY_NAME: string
  AWS_REGION: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_SESSION_TOKEN: string
  AWS_KMS_ENDPOINT: string
  AWS_KMS_PEOPLE_KEY_ID: string
  AWS_KMS_INTEGRATIONS_KEY_ID: string
}>

export type Env = {
  Bindings: KmsBindings
  Variables: {
    db: PostgresJsDatabase
    container?: ModuleContainer
    userId?: string
    actor?: "staff" | "customer" | "partner" | "supplier"
    callerType?: "session" | "api_key" | "internal"
    scopes?: string[] | null
    isInternalRequest?: boolean
    authorizeTransactionPii?: (args: {
      db: PostgresJsDatabase
      userId?: string
      actor?: "staff" | "customer" | "partner" | "supplier"
      callerType?: "session" | "api_key" | "internal"
      scopes?: string[] | null
      isInternalRequest?: boolean
      participantKind: "offer" | "order"
      participantId: string
      parentId: string
      action: "read" | "update" | "delete"
    }) => boolean | Promise<boolean>
  }
}

function hasPiiScope(scopes: string[] | null | undefined, action: "read" | "update" | "delete") {
  if (!scopes || scopes.length === 0) {
    return false
  }

  return (
    scopes.includes("*") ||
    scopes.includes("transactions-pii:*") ||
    scopes.includes(`transactions-pii:${action}`)
  )
}

export function hasParticipantIdentityInput(body: Record<string, unknown>) {
  return "dateOfBirth" in body || "nationality" in body
}

export async function logTransactionPiiAccess(
  c: Context<Env>,
  input: {
    participantKind: "offer" | "order"
    parentId?: string
    participantId?: string
    action: "read" | "update" | "delete"
    outcome: "allowed" | "denied"
    reason?: string
    metadata?: Record<string, unknown>
  },
) {
  await c
    .get("db")
    .insert(transactionPiiAccessLog)
    .values({
      participantKind: input.participantKind,
      parentId: input.parentId ?? null,
      participantId: input.participantId ?? null,
      actorId: c.get("userId") ?? null,
      actorType: c.get("actor") ?? null,
      callerType: c.get("callerType") ?? null,
      action: input.action,
      outcome: input.outcome,
      reason: input.reason ?? null,
      metadata: input.metadata ?? null,
    })
}

export async function authorizeTransactionPiiAccess(
  c: Context<Env>,
  input: {
    participantKind: "offer" | "order"
    participantId: string
    parentId: string
    action: "read" | "update" | "delete"
  },
) {
  if (c.get("isInternalRequest")) {
    return { allowed: true as const }
  }

  const userId = c.get("userId")
  if (!userId) {
    await logTransactionPiiAccess(c, { ...input, outcome: "denied", reason: "missing_user" })
    return {
      allowed: false as const,
      response: handleApiError(new UnauthorizedApiError(), c),
    }
  }

  const customAuthorizer = c.get("authorizeTransactionPii")
  if (customAuthorizer) {
    const allowed = await customAuthorizer({
      db: c.get("db"),
      userId,
      actor: c.get("actor"),
      callerType: c.get("callerType"),
      scopes: c.get("scopes"),
      isInternalRequest: c.get("isInternalRequest"),
      ...input,
    })

    if (!allowed) {
      await logTransactionPiiAccess(c, {
        ...input,
        outcome: "denied",
        reason: "custom_policy_denied",
      })
      return {
        allowed: false as const,
        response: handleApiError(new ForbiddenApiError(), c),
      }
    }

    return { allowed: true as const }
  }

  const allowed = hasPiiScope(c.get("scopes"), input.action) || c.get("actor") === "staff"
  if (!allowed) {
    await logTransactionPiiAccess(c, {
      ...input,
      outcome: "denied",
      reason: "insufficient_scope",
      metadata: { actor: c.get("actor") ?? null },
    })
    return {
      allowed: false as const,
      response: handleApiError(new ForbiddenApiError(), c),
    }
  }

  return { allowed: true as const }
}

function getRouteRuntime(c: Context<Env>): TransactionsRouteRuntime {
  const runtime = c.var.container?.resolve<TransactionsRouteRuntime>(
    TRANSACTIONS_ROUTE_RUNTIME_CONTAINER_KEY,
  )

  return runtime ?? buildTransactionsRouteRuntime(c.env)
}

export function createPiiService(
  c: Context<Env>,
  _participantKind: "offer" | "order",
  parentId: string,
) {
  const runtime = getRouteRuntime(c)

  return createTransactionPiiService({
    kms: runtime.getKmsProvider(),
    onAudit: async (event) => {
      await logTransactionPiiAccess(c, {
        participantKind: event.participantKind,
        parentId,
        participantId: event.participantId,
        action: event.action,
        outcome: "allowed",
      })
    },
  })
}

export function notFound(c: Context<Env>, message: string) {
  return c.json({ error: message }, 404)
}
