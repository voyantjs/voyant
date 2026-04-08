import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono, type Context } from "hono"

import { createKmsProviderFromEnv } from "@voyantjs/utils"

import { createTransactionPiiService } from "./pii.js"
import { transactionPiiAccessLog } from "./schema.js"
import { transactionsService } from "./service.js"
import {
  insertOfferItemParticipantSchema,
  insertOfferItemSchema,
  insertOfferParticipantSchema,
  insertOfferSchema,
  insertOrderItemParticipantSchema,
  insertOrderItemSchema,
  insertOrderParticipantSchema,
  insertOrderSchema,
  insertOrderTermSchema,
  offerItemListQuerySchema,
  offerItemParticipantListQuerySchema,
  offerListQuerySchema,
  offerParticipantListQuerySchema,
  orderItemListQuerySchema,
  orderItemParticipantListQuerySchema,
  orderListQuerySchema,
  orderParticipantListQuerySchema,
  orderTermListQuerySchema,
  updateOfferItemParticipantSchema,
  updateOfferItemSchema,
  updateOfferParticipantSchema,
  updateOfferSchema,
  updateOrderItemParticipantSchema,
  updateOrderItemSchema,
  updateOrderParticipantSchema,
  updateOrderSchema,
  updateOrderTermSchema,
} from "./validation.js"

type Env = {
  Bindings: Partial<{
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
  Variables: {
    db: PostgresJsDatabase
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

function getRuntimeEnv(c: Context<Env>) {
  const processEnv = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> }
    }
  ).process?.env ?? {}

  return {
    ...processEnv,
    ...(c.env ?? {}),
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

function hasParticipantIdentityInput(body: Record<string, unknown>) {
  return "dateOfBirth" in body || "nationality" in body
}

async function logTransactionPiiAccess(
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
  await c.get("db").insert(transactionPiiAccessLog).values({
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

async function authorizeTransactionPiiAccess(
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
    await logTransactionPiiAccess(c, {
      ...input,
      outcome: "denied",
      reason: "missing_user",
    })
    return { allowed: false as const, response: c.json({ error: "Unauthorized" }, 401) }
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
      return { allowed: false as const, response: c.json({ error: "Forbidden" }, 403) }
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
    return { allowed: false as const, response: c.json({ error: "Forbidden" }, 403) }
  }

  return { allowed: true as const }
}

export const transactionsRoutes = new Hono<Env>()
  .get("/offers", async (c) => {
    const query = offerListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await transactionsService.listOffers(c.get("db"), query))
  })
  .post("/offers", async (c) => {
    return c.json(
      {
        data: await transactionsService.createOffer(
          c.get("db"),
          insertOfferSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/offers/:id", async (c) => {
    const row = await transactionsService.getOfferById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/offers/:id", async (c) => {
    const row = await transactionsService.updateOffer(
      c.get("db"),
      c.req.param("id"),
      updateOfferSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Offer not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/offers/:id", async (c) => {
    const row = await transactionsService.deleteOffer(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer not found" }, 404)
    return c.json({ success: true })
  })
  .get("/offer-participants", async (c) => {
    const query = offerParticipantListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOfferParticipants(c.get("db"), query))
  })
  .post("/offer-participants", async (c) => {
    const payload = insertOfferParticipantSchema.parse(await c.req.json())
    return c.json(
      {
        data: await (async () => {
          const row = await transactionsService.createOfferParticipant(c.get("db"), payload)
          if (!row) return row

          if (hasParticipantIdentityInput(payload)) {
            const pii = createTransactionPiiService({
              kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
              onAudit: async (event) => {
                await logTransactionPiiAccess(c, {
                  participantKind: event.participantKind,
                  parentId: row.offerId,
                  participantId: event.participantId,
                  action: event.action,
                  outcome: "allowed",
                })
              },
            })

            await pii.upsertParticipantIdentity(c.get("db"), "offer", row.id, payload, c.get("userId"))
            return transactionsService.getOfferParticipantById(c.get("db"), row.id)
          }

          return row
        })(),
      },
      201,
    )
  })
  .get("/offer-participants/:id", async (c) => {
    const row = await transactionsService.getOfferParticipantById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer participant not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/offer-participants/:id", async (c) => {
    const payload = updateOfferParticipantSchema.parse(await c.req.json())
    const row = await transactionsService.updateOfferParticipant(c.get("db"), c.req.param("id"), payload)
    if (!row) return c.json({ error: "Offer participant not found" }, 404)
    if (hasParticipantIdentityInput(payload)) {
      const pii = createTransactionPiiService({
        kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
        onAudit: async (event) => {
          await logTransactionPiiAccess(c, {
            participantKind: event.participantKind,
            parentId: row.offerId,
            participantId: event.participantId,
            action: event.action,
            outcome: "allowed",
          })
        },
      })
      await pii.upsertParticipantIdentity(c.get("db"), "offer", row.id, payload, c.get("userId"))
      return c.json({ data: await transactionsService.getOfferParticipantById(c.get("db"), row.id) })
    }
    return c.json({ data: row })
  })
  .get("/offer-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOfferParticipantById(c.get("db"), c.req.param("id"))
    if (!participant) return c.json({ error: "Offer participant not found" }, 404)

    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "offer",
      participantId: participant.id,
      parentId: participant.offerId,
      action: "read",
    })
    if (!auth.allowed) return auth.response

    const pii = createTransactionPiiService({
      kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
      onAudit: async (event) => {
        await logTransactionPiiAccess(c, {
          participantKind: event.participantKind,
          parentId: participant.offerId,
          participantId: event.participantId,
          action: event.action,
          outcome: "allowed",
        })
      },
    })
    const row = await pii.getParticipantIdentity(c.get("db"), "offer", participant.id, c.get("userId"))
    if (!row) {
      await logTransactionPiiAccess(c, {
        participantKind: "offer",
        parentId: participant.offerId,
        participantId: participant.id,
        action: "read",
        outcome: "denied",
        reason: "travel_details_not_found",
      })
      return c.json({ error: "Offer participant travel details not found" }, 404)
    }
    return c.json({ data: row })
  })
  .patch("/offer-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOfferParticipantById(c.get("db"), c.req.param("id"))
    if (!participant) return c.json({ error: "Offer participant not found" }, 404)

    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "offer",
      participantId: participant.id,
      parentId: participant.offerId,
      action: "update",
    })
    if (!auth.allowed) return auth.response

    const pii = createTransactionPiiService({
      kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
      onAudit: async (event) => {
        await logTransactionPiiAccess(c, {
          participantKind: event.participantKind,
          parentId: participant.offerId,
          participantId: event.participantId,
          action: event.action,
          outcome: "allowed",
        })
      },
    })
    const row = await pii.upsertParticipantIdentity(
      c.get("db"),
      "offer",
      participant.id,
      updateOfferParticipantSchema.parse(await c.req.json()),
      c.get("userId"),
    )
    if (!row) return c.json({ error: "Offer participant not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/offer-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOfferParticipantById(c.get("db"), c.req.param("id"))
    if (!participant) return c.json({ error: "Offer participant not found" }, 404)

    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "offer",
      participantId: participant.id,
      parentId: participant.offerId,
      action: "delete",
    })
    if (!auth.allowed) return auth.response

    const pii = createTransactionPiiService({
      kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
      onAudit: async (event) => {
        await logTransactionPiiAccess(c, {
          participantKind: event.participantKind,
          parentId: participant.offerId,
          participantId: event.participantId,
          action: event.action,
          outcome: "allowed",
        })
      },
    })
    const row = await pii.deleteParticipantIdentity(c.get("db"), "offer", participant.id, c.get("userId"))
    if (!row) return c.json({ error: "Offer participant travel details not found" }, 404)
    return c.json({ success: true })
  })
  .delete("/offer-participants/:id", async (c) => {
    const row = await transactionsService.deleteOfferParticipant(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer participant not found" }, 404)
    return c.json({ success: true })
  })
  .get("/offer-items", async (c) => {
    const query = offerItemListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOfferItems(c.get("db"), query))
  })
  .post("/offer-items", async (c) => {
    return c.json(
      {
        data: await transactionsService.createOfferItem(
          c.get("db"),
          insertOfferItemSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/offer-items/:id", async (c) => {
    const row = await transactionsService.getOfferItemById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer item not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/offer-items/:id", async (c) => {
    const row = await transactionsService.updateOfferItem(
      c.get("db"),
      c.req.param("id"),
      updateOfferItemSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Offer item not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/offer-items/:id", async (c) => {
    const row = await transactionsService.deleteOfferItem(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer item not found" }, 404)
    return c.json({ success: true })
  })
  .get("/offer-item-participants", async (c) => {
    const query = offerItemParticipantListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOfferItemParticipants(c.get("db"), query))
  })
  .post("/offer-item-participants", async (c) => {
    return c.json(
      {
        data: await transactionsService.createOfferItemParticipant(
          c.get("db"),
          insertOfferItemParticipantSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/offer-item-participants/:id", async (c) => {
    const row = await transactionsService.getOfferItemParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!row) return c.json({ error: "Offer item participant not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/offer-item-participants/:id", async (c) => {
    const row = await transactionsService.updateOfferItemParticipant(
      c.get("db"),
      c.req.param("id"),
      updateOfferItemParticipantSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Offer item participant not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/offer-item-participants/:id", async (c) => {
    const row = await transactionsService.deleteOfferItemParticipant(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Offer item participant not found" }, 404)
    return c.json({ success: true })
  })
  .get("/orders", async (c) => {
    const query = orderListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await transactionsService.listOrders(c.get("db"), query))
  })
  .post("/orders", async (c) => {
    return c.json(
      {
        data: await transactionsService.createOrder(
          c.get("db"),
          insertOrderSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/orders/:id", async (c) => {
    const row = await transactionsService.getOrderById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Order not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/orders/:id", async (c) => {
    const row = await transactionsService.updateOrder(
      c.get("db"),
      c.req.param("id"),
      updateOrderSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Order not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/orders/:id", async (c) => {
    const row = await transactionsService.deleteOrder(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Order not found" }, 404)
    return c.json({ success: true })
  })
  .get("/order-participants", async (c) => {
    const query = orderParticipantListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOrderParticipants(c.get("db"), query))
  })
  .post("/order-participants", async (c) => {
    const payload = insertOrderParticipantSchema.parse(await c.req.json())
    return c.json(
      {
        data: await (async () => {
          const row = await transactionsService.createOrderParticipant(c.get("db"), payload)
          if (!row) return row

          if (hasParticipantIdentityInput(payload)) {
            const pii = createTransactionPiiService({
              kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
              onAudit: async (event) => {
                await logTransactionPiiAccess(c, {
                  participantKind: event.participantKind,
                  parentId: row.orderId,
                  participantId: event.participantId,
                  action: event.action,
                  outcome: "allowed",
                })
              },
            })

            await pii.upsertParticipantIdentity(c.get("db"), "order", row.id, payload, c.get("userId"))
            return transactionsService.getOrderParticipantById(c.get("db"), row.id)
          }

          return row
        })(),
      },
      201,
    )
  })
  .get("/order-participants/:id", async (c) => {
    const row = await transactionsService.getOrderParticipantById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Order participant not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/order-participants/:id", async (c) => {
    const payload = updateOrderParticipantSchema.parse(await c.req.json())
    const row = await transactionsService.updateOrderParticipant(c.get("db"), c.req.param("id"), payload)
    if (!row) return c.json({ error: "Order participant not found" }, 404)
    if (hasParticipantIdentityInput(payload)) {
      const pii = createTransactionPiiService({
        kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
        onAudit: async (event) => {
          await logTransactionPiiAccess(c, {
            participantKind: event.participantKind,
            parentId: row.orderId,
            participantId: event.participantId,
            action: event.action,
            outcome: "allowed",
          })
        },
      })
      await pii.upsertParticipantIdentity(c.get("db"), "order", row.id, payload, c.get("userId"))
      return c.json({ data: await transactionsService.getOrderParticipantById(c.get("db"), row.id) })
    }
    return c.json({ data: row })
  })
  .get("/order-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOrderParticipantById(c.get("db"), c.req.param("id"))
    if (!participant) return c.json({ error: "Order participant not found" }, 404)

    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "order",
      participantId: participant.id,
      parentId: participant.orderId,
      action: "read",
    })
    if (!auth.allowed) return auth.response

    const pii = createTransactionPiiService({
      kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
      onAudit: async (event) => {
        await logTransactionPiiAccess(c, {
          participantKind: event.participantKind,
          parentId: participant.orderId,
          participantId: event.participantId,
          action: event.action,
          outcome: "allowed",
        })
      },
    })
    const row = await pii.getParticipantIdentity(c.get("db"), "order", participant.id, c.get("userId"))
    if (!row) {
      await logTransactionPiiAccess(c, {
        participantKind: "order",
        parentId: participant.orderId,
        participantId: participant.id,
        action: "read",
        outcome: "denied",
        reason: "travel_details_not_found",
      })
      return c.json({ error: "Order participant travel details not found" }, 404)
    }
    return c.json({ data: row })
  })
  .patch("/order-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOrderParticipantById(c.get("db"), c.req.param("id"))
    if (!participant) return c.json({ error: "Order participant not found" }, 404)

    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "order",
      participantId: participant.id,
      parentId: participant.orderId,
      action: "update",
    })
    if (!auth.allowed) return auth.response

    const pii = createTransactionPiiService({
      kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
      onAudit: async (event) => {
        await logTransactionPiiAccess(c, {
          participantKind: event.participantKind,
          parentId: participant.orderId,
          participantId: event.participantId,
          action: event.action,
          outcome: "allowed",
        })
      },
    })
    const row = await pii.upsertParticipantIdentity(
      c.get("db"),
      "order",
      participant.id,
      updateOrderParticipantSchema.parse(await c.req.json()),
      c.get("userId"),
    )
    if (!row) return c.json({ error: "Order participant not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/order-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOrderParticipantById(c.get("db"), c.req.param("id"))
    if (!participant) return c.json({ error: "Order participant not found" }, 404)

    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "order",
      participantId: participant.id,
      parentId: participant.orderId,
      action: "delete",
    })
    if (!auth.allowed) return auth.response

    const pii = createTransactionPiiService({
      kms: createKmsProviderFromEnv(getRuntimeEnv(c)),
      onAudit: async (event) => {
        await logTransactionPiiAccess(c, {
          participantKind: event.participantKind,
          parentId: participant.orderId,
          participantId: event.participantId,
          action: event.action,
          outcome: "allowed",
        })
      },
    })
    const row = await pii.deleteParticipantIdentity(c.get("db"), "order", participant.id, c.get("userId"))
    if (!row) return c.json({ error: "Order participant travel details not found" }, 404)
    return c.json({ success: true })
  })
  .delete("/order-participants/:id", async (c) => {
    const row = await transactionsService.deleteOrderParticipant(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Order participant not found" }, 404)
    return c.json({ success: true })
  })
  .get("/order-items", async (c) => {
    const query = orderItemListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOrderItems(c.get("db"), query))
  })
  .post("/order-items", async (c) => {
    return c.json(
      {
        data: await transactionsService.createOrderItem(
          c.get("db"),
          insertOrderItemSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/order-items/:id", async (c) => {
    const row = await transactionsService.getOrderItemById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Order item not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/order-items/:id", async (c) => {
    const row = await transactionsService.updateOrderItem(
      c.get("db"),
      c.req.param("id"),
      updateOrderItemSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Order item not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/order-items/:id", async (c) => {
    const row = await transactionsService.deleteOrderItem(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Order item not found" }, 404)
    return c.json({ success: true })
  })
  .get("/order-item-participants", async (c) => {
    const query = orderItemParticipantListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOrderItemParticipants(c.get("db"), query))
  })
  .post("/order-item-participants", async (c) => {
    return c.json(
      {
        data: await transactionsService.createOrderItemParticipant(
          c.get("db"),
          insertOrderItemParticipantSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/order-item-participants/:id", async (c) => {
    const row = await transactionsService.getOrderItemParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!row) return c.json({ error: "Order item participant not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/order-item-participants/:id", async (c) => {
    const row = await transactionsService.updateOrderItemParticipant(
      c.get("db"),
      c.req.param("id"),
      updateOrderItemParticipantSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Order item participant not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/order-item-participants/:id", async (c) => {
    const row = await transactionsService.deleteOrderItemParticipant(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Order item participant not found" }, 404)
    return c.json({ success: true })
  })
  .get("/order-terms", async (c) => {
    const query = orderTermListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOrderTerms(c.get("db"), query))
  })
  .post("/order-terms", async (c) => {
    return c.json(
      {
        data: await transactionsService.createOrderTerm(
          c.get("db"),
          insertOrderTermSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/order-terms/:id", async (c) => {
    const row = await transactionsService.getOrderTermById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Order term not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/order-terms/:id", async (c) => {
    const row = await transactionsService.updateOrderTerm(
      c.get("db"),
      c.req.param("id"),
      updateOrderTermSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Order term not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/order-terms/:id", async (c) => {
    const row = await transactionsService.deleteOrderTerm(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Order term not found" }, 404)
    return c.json({ success: true })
  })

export type TransactionsRoutes = typeof transactionsRoutes
