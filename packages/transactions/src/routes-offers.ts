import { Hono } from "hono"
import {
  authorizeTransactionPiiAccess,
  createPiiService,
  type Env,
  hasParticipantIdentityInput,
  logTransactionPiiAccess,
  notFound,
} from "./routes-shared.js"
import { transactionsService } from "./service.js"
import {
  insertOfferItemParticipantSchema,
  insertOfferItemSchema,
  insertOfferParticipantSchema,
  insertOfferSchema,
  offerItemListQuerySchema,
  offerItemParticipantListQuerySchema,
  offerListQuerySchema,
  offerParticipantListQuerySchema,
  updateOfferItemParticipantSchema,
  updateOfferItemSchema,
  updateOfferParticipantSchema,
  updateOfferSchema,
} from "./validation.js"

export const transactionOfferRoutes = new Hono<Env>()
  .get("/offers", async (c) => {
    const query = offerListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await transactionsService.listOffers(c.get("db"), query))
  })
  .post("/offers", async (c) =>
    c.json(
      {
        data: await transactionsService.createOffer(
          c.get("db"),
          insertOfferSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/offers/:id", async (c) => {
    const row = await transactionsService.getOfferById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Offer not found")
  })
  .patch("/offers/:id", async (c) => {
    const row = await transactionsService.updateOffer(
      c.get("db"),
      c.req.param("id"),
      updateOfferSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer not found")
  })
  .delete("/offers/:id", async (c) => {
    const row = await transactionsService.deleteOffer(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Offer not found")
  })
  .get("/offer-participants", async (c) => {
    const query = offerParticipantListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOfferParticipants(c.get("db"), query))
  })
  .post("/offer-participants", async (c) => {
    const payload = insertOfferParticipantSchema.parse(await c.req.json())
    const row = await transactionsService.createOfferParticipant(c.get("db"), payload)
    if (!row) return c.json({ data: row }, 201)
    if (hasParticipantIdentityInput(payload)) {
      const pii = createPiiService(c, "offer", row.offerId)
      await pii.upsertParticipantIdentity(c.get("db"), "offer", row.id, payload, c.get("userId"))
      return c.json(
        { data: await transactionsService.getOfferParticipantById(c.get("db"), row.id) },
        201,
      )
    }
    return c.json({ data: row }, 201)
  })
  .get("/offer-participants/:id", async (c) => {
    const row = await transactionsService.getOfferParticipantById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Offer participant not found")
  })
  .patch("/offer-participants/:id", async (c) => {
    const payload = updateOfferParticipantSchema.parse(await c.req.json())
    const row = await transactionsService.updateOfferParticipant(
      c.get("db"),
      c.req.param("id"),
      payload,
    )
    if (!row) return notFound(c, "Offer participant not found")
    if (hasParticipantIdentityInput(payload)) {
      const pii = createPiiService(c, "offer", row.offerId)
      await pii.upsertParticipantIdentity(c.get("db"), "offer", row.id, payload, c.get("userId"))
      return c.json({
        data: await transactionsService.getOfferParticipantById(c.get("db"), row.id),
      })
    }
    return c.json({ data: row })
  })
  .get("/offer-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOfferParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!participant) return notFound(c, "Offer participant not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "offer",
      participantId: participant.id,
      parentId: participant.offerId,
      action: "read",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "offer", participant.offerId)
    const row = await pii.getParticipantIdentity(
      c.get("db"),
      "offer",
      participant.id,
      c.get("userId"),
    )
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
    const participant = await transactionsService.getOfferParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!participant) return notFound(c, "Offer participant not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "offer",
      participantId: participant.id,
      parentId: participant.offerId,
      action: "update",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "offer", participant.offerId)
    const row = await pii.upsertParticipantIdentity(
      c.get("db"),
      "offer",
      participant.id,
      updateOfferParticipantSchema.parse(await c.req.json()),
      c.get("userId"),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer participant not found")
  })
  .delete("/offer-participants/:id/travel-details", async (c) => {
    const participant = await transactionsService.getOfferParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!participant) return notFound(c, "Offer participant not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      participantKind: "offer",
      participantId: participant.id,
      parentId: participant.offerId,
      action: "delete",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "offer", participant.offerId)
    const row = await pii.deleteParticipantIdentity(
      c.get("db"),
      "offer",
      participant.id,
      c.get("userId"),
    )
    return row
      ? c.json({ success: true })
      : c.json({ error: "Offer participant travel details not found" }, 404)
  })
  .delete("/offer-participants/:id", async (c) => {
    const row = await transactionsService.deleteOfferParticipant(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Offer participant not found")
  })
  .get("/offer-items", async (c) => {
    const query = offerItemListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOfferItems(c.get("db"), query))
  })
  .post("/offer-items", async (c) =>
    c.json(
      {
        data: await transactionsService.createOfferItem(
          c.get("db"),
          insertOfferItemSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/offer-items/:id", async (c) => {
    const row = await transactionsService.getOfferItemById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Offer item not found")
  })
  .patch("/offer-items/:id", async (c) => {
    const row = await transactionsService.updateOfferItem(
      c.get("db"),
      c.req.param("id"),
      updateOfferItemSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer item not found")
  })
  .delete("/offer-items/:id", async (c) => {
    const row = await transactionsService.deleteOfferItem(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Offer item not found")
  })
  .get("/offer-item-participants", async (c) => {
    const query = offerItemParticipantListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await transactionsService.listOfferItemParticipants(c.get("db"), query))
  })
  .post("/offer-item-participants", async (c) =>
    c.json(
      {
        data: await transactionsService.createOfferItemParticipant(
          c.get("db"),
          insertOfferItemParticipantSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/offer-item-participants/:id", async (c) => {
    const row = await transactionsService.getOfferItemParticipantById(
      c.get("db"),
      c.req.param("id"),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer item participant not found")
  })
  .patch("/offer-item-participants/:id", async (c) => {
    const row = await transactionsService.updateOfferItemParticipant(
      c.get("db"),
      c.req.param("id"),
      updateOfferItemParticipantSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer item participant not found")
  })
  .delete("/offer-item-participants/:id", async (c) => {
    const row = await transactionsService.deleteOfferItemParticipant(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Offer item participant not found")
  })
