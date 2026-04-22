import { normalizeValidationError, parseJsonBody, parseQuery } from "@voyantjs/hono"
import { Hono } from "hono"
import {
  authorizeTransactionPiiAccess,
  createPiiService,
  type Env,
  hasTravelerIdentityInput,
  logTransactionPiiAccess,
  notFound,
} from "./routes-shared.js"
import { transactionsService } from "./service.js"
import { toTravelerIdentityResponse } from "./service-shared.js"
import {
  insertOfferContactAssignmentSchema,
  insertOfferItemSchema,
  insertOfferItemTravelerSchema,
  insertOfferSchema,
  insertOfferStaffAssignmentSchema,
  insertOfferTravelerSchema,
  offerContactAssignmentListQuerySchema,
  offerItemListQuerySchema,
  offerItemTravelerListQuerySchema,
  offerListQuerySchema,
  offerStaffAssignmentListQuerySchema,
  offerTravelerListQuerySchema,
  updateOfferContactAssignmentSchema,
  updateOfferItemSchema,
  updateOfferItemTravelerSchema,
  updateOfferSchema,
  updateOfferStaffAssignmentSchema,
  updateOfferTravelerSchema,
} from "./validation.js"

export const transactionOfferRoutes = new Hono<Env>()
  .get("/offers", async (c) => {
    const query = parseQuery(c, offerListQuerySchema)
    return c.json(await transactionsService.listOffers(c.get("db"), query))
  })
  .post("/offers", async (c) =>
    c.json(
      {
        data: await transactionsService.createOffer(
          c.get("db"),
          await parseJsonBody(c, insertOfferSchema),
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
      await parseJsonBody(c, updateOfferSchema),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer not found")
  })
  .delete("/offers/:id", async (c) => {
    const row = await transactionsService.deleteOffer(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Offer not found")
  })
  .get("/offer-travelers", async (c) => {
    const query = parseQuery(c, offerTravelerListQuerySchema)
    return c.json(await transactionsService.listOfferTravelers(c.get("db"), query))
  })
  .post("/offer-travelers", async (c) => {
    try {
      const payload = await parseJsonBody(c, insertOfferTravelerSchema)
      const row = await transactionsService.createOfferTraveler(c.get("db"), payload)
      if (!row) return c.json({ data: row }, 201)
      if (hasTravelerIdentityInput(payload)) {
        const pii = createPiiService(c, "offer", row.offerId)
        await pii.upsertTravelerIdentity(c.get("db"), "offer", row.id, payload, c.get("userId"))
        return c.json(
          { data: await transactionsService.getOfferTravelerById(c.get("db"), row.id) },
          201,
        )
      }
      return c.json({ data: row }, 201)
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .get("/offer-travelers/:id", async (c) => {
    const row = await transactionsService.getOfferTravelerById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Offer traveler not found")
  })
  .patch("/offer-travelers/:id", async (c) => {
    try {
      const payload = await parseJsonBody(c, updateOfferTravelerSchema)
      const row = await transactionsService.updateOfferTraveler(
        c.get("db"),
        c.req.param("id"),
        payload,
      )
      if (!row) return notFound(c, "Offer traveler not found")
      if (hasTravelerIdentityInput(payload)) {
        const pii = createPiiService(c, "offer", row.offerId)
        await pii.upsertTravelerIdentity(c.get("db"), "offer", row.id, payload, c.get("userId"))
        return c.json({
          data: await transactionsService.getOfferTravelerById(c.get("db"), row.id),
        })
      }
      return c.json({ data: row })
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .get("/offer-travelers/:id/travel-details", async (c) => {
    const traveler = await transactionsService.getOfferTravelerById(c.get("db"), c.req.param("id"))
    if (!traveler) return notFound(c, "Offer traveler not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      travelerKind: "offer",
      travelerId: traveler.id,
      parentId: traveler.offerId,
      action: "read",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "offer", traveler.offerId)
    const row = await pii.getTravelerIdentity(c.get("db"), "offer", traveler.id, c.get("userId"))
    if (!row) {
      await logTransactionPiiAccess(c, {
        travelerKind: "offer",
        parentId: traveler.offerId,
        travelerId: traveler.id,
        action: "read",
        outcome: "denied",
        reason: "travel_details_not_found",
      })
      return c.json({ error: "Offer traveler travel details not found" }, 404)
    }
    return c.json({ data: toTravelerIdentityResponse(row) })
  })
  .patch("/offer-travelers/:id/travel-details", async (c) => {
    const traveler = await transactionsService.getOfferTravelerById(c.get("db"), c.req.param("id"))
    if (!traveler) return notFound(c, "Offer traveler not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      travelerKind: "offer",
      travelerId: traveler.id,
      parentId: traveler.offerId,
      action: "update",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "offer", traveler.offerId)
    const row = await pii.upsertTravelerIdentity(
      c.get("db"),
      "offer",
      traveler.id,
      await parseJsonBody(c, updateOfferTravelerSchema),
      c.get("userId"),
    )
    return row
      ? c.json({ data: toTravelerIdentityResponse(row) })
      : notFound(c, "Offer traveler not found")
  })
  .delete("/offer-travelers/:id/travel-details", async (c) => {
    const traveler = await transactionsService.getOfferTravelerById(c.get("db"), c.req.param("id"))
    if (!traveler) return notFound(c, "Offer traveler not found")
    const auth = await authorizeTransactionPiiAccess(c, {
      travelerKind: "offer",
      travelerId: traveler.id,
      parentId: traveler.offerId,
      action: "delete",
    })
    if (!auth.allowed) return auth.response
    const pii = createPiiService(c, "offer", traveler.offerId)
    const row = await pii.deleteTravelerIdentity(c.get("db"), "offer", traveler.id, c.get("userId"))
    return row
      ? c.json({ success: true })
      : c.json({ error: "Offer traveler travel details not found" }, 404)
  })
  .delete("/offer-travelers/:id", async (c) => {
    const row = await transactionsService.deleteOfferTraveler(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Offer traveler not found")
  })
  .get("/offer-contact-assignments", async (c) => {
    const query = parseQuery(c, offerContactAssignmentListQuerySchema)
    return c.json(await transactionsService.listOfferContactAssignments(c.get("db"), query))
  })
  .post("/offer-contact-assignments", async (c) => {
    try {
      const row = await transactionsService.createOfferContactAssignment(
        c.get("db"),
        await parseJsonBody(c, insertOfferContactAssignmentSchema),
      )
      return c.json({ data: row }, 201)
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .get("/offer-contact-assignments/:id", async (c) => {
    const row = await transactionsService.getOfferContactAssignmentById(
      c.get("db"),
      c.req.param("id"),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer contact assignment not found")
  })
  .patch("/offer-contact-assignments/:id", async (c) => {
    try {
      const row = await transactionsService.updateOfferContactAssignment(
        c.get("db"),
        c.req.param("id"),
        await parseJsonBody(c, updateOfferContactAssignmentSchema),
      )
      return row ? c.json({ data: row }) : notFound(c, "Offer contact assignment not found")
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .delete("/offer-contact-assignments/:id", async (c) => {
    const row = await transactionsService.deleteOfferContactAssignment(
      c.get("db"),
      c.req.param("id"),
    )
    return row ? c.json({ success: true }) : notFound(c, "Offer contact assignment not found")
  })
  .get("/offer-staff-assignments", async (c) => {
    const query = parseQuery(c, offerStaffAssignmentListQuerySchema)
    return c.json(await transactionsService.listOfferStaffAssignments(c.get("db"), query))
  })
  .post("/offer-staff-assignments", async (c) => {
    try {
      const row = await transactionsService.createOfferStaffAssignment(
        c.get("db"),
        await parseJsonBody(c, insertOfferStaffAssignmentSchema),
      )
      return c.json({ data: row }, 201)
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .get("/offer-staff-assignments/:id", async (c) => {
    const row = await transactionsService.getOfferStaffAssignmentById(
      c.get("db"),
      c.req.param("id"),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer staff assignment not found")
  })
  .patch("/offer-staff-assignments/:id", async (c) => {
    try {
      const row = await transactionsService.updateOfferStaffAssignment(
        c.get("db"),
        c.req.param("id"),
        await parseJsonBody(c, updateOfferStaffAssignmentSchema),
      )
      return row ? c.json({ data: row }) : notFound(c, "Offer staff assignment not found")
    } catch (error) {
      const validationError = normalizeValidationError(error)
      if (validationError?.status === 400) {
        return c.json(
          {
            error: validationError.message,
            details: validationError.details?.fields ?? validationError.details,
          },
          400,
        )
      }

      throw error
    }
  })
  .delete("/offer-staff-assignments/:id", async (c) => {
    const row = await transactionsService.deleteOfferStaffAssignment(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Offer staff assignment not found")
  })
  .get("/offer-items", async (c) => {
    const query = parseQuery(c, offerItemListQuerySchema)
    return c.json(await transactionsService.listOfferItems(c.get("db"), query))
  })
  .post("/offer-items", async (c) =>
    c.json(
      {
        data: await transactionsService.createOfferItem(
          c.get("db"),
          await parseJsonBody(c, insertOfferItemSchema),
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
      await parseJsonBody(c, updateOfferItemSchema),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer item not found")
  })
  .delete("/offer-items/:id", async (c) => {
    const row = await transactionsService.deleteOfferItem(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Offer item not found")
  })
  .get("/offer-item-travelers", async (c) => {
    const query = parseQuery(c, offerItemTravelerListQuerySchema)
    return c.json(await transactionsService.listOfferItemTravelers(c.get("db"), query))
  })
  .post("/offer-item-travelers", async (c) =>
    c.json(
      {
        data: await transactionsService.createOfferItemTraveler(
          c.get("db"),
          await parseJsonBody(c, insertOfferItemTravelerSchema),
        ),
      },
      201,
    ),
  )
  .get("/offer-item-travelers/:id", async (c) => {
    const row = await transactionsService.getOfferItemTravelerById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Offer item traveler not found")
  })
  .patch("/offer-item-travelers/:id", async (c) => {
    const row = await transactionsService.updateOfferItemTraveler(
      c.get("db"),
      c.req.param("id"),
      await parseJsonBody(c, updateOfferItemTravelerSchema),
    )
    return row ? c.json({ data: row }) : notFound(c, "Offer item traveler not found")
  })
  .delete("/offer-item-travelers/:id", async (c) => {
    const row = await transactionsService.deleteOfferItemTraveler(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Offer item traveler not found")
  })
