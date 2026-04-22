import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import { Hono } from "hono"

import { type Env, notFound } from "./routes-shared.js"
import { publicBookingsService } from "./service-public.js"
import {
  publicBookingOverviewLookupQuerySchema,
  publicBookingSessionMutationSchema,
  publicCreateBookingSessionSchema,
  publicRepriceBookingSessionSchema,
  publicUpdateBookingSessionSchema,
  publicUpsertBookingSessionStateSchema,
} from "./validation-public.js"

function hasSessionResult(
  result: { status: string } | { status: "ok"; session: unknown },
): result is { status: "ok"; session: unknown } {
  return "session" in result
}

function sessionConflictError(status: string) {
  switch (status) {
    case "insufficient_capacity":
      return "Insufficient slot capacity"
    case "slot_unavailable":
      return "Availability slot is not bookable"
    case "invalid_transition":
      return "Booking session cannot move to the requested state"
    case "hold_expired":
      return "Booking session hold has expired"
    case "participant_not_found":
      return "Booking session traveler not found"
    case "pricing_unavailable":
      return "Pricing is not available for the selected booking session items"
    case "quantity_change_requires_reallocation":
      return "Changing quantity for held items requires a fresh reservation"
    default:
      return "Unable to process booking session"
  }
}

export const publicBookingRoutes = new Hono<Env>()
  .post("/sessions", async (c) => {
    const result = await publicBookingsService.createSession(
      c.get("db"),
      await parseJsonBody(c, publicCreateBookingSessionSchema),
      c.get("userId"),
    )

    if (result.status === "slot_not_found") {
      return notFound(c, "Availability slot not found")
    }

    if (!hasSessionResult(result)) {
      return c.json({ error: sessionConflictError(result.status) }, 409)
    }

    return c.json({ data: result.session }, 201)
  })
  .get("/sessions/:sessionId", async (c) => {
    const session = await publicBookingsService.getSessionById(
      c.get("db"),
      c.req.param("sessionId"),
    )

    return session ? c.json({ data: session }) : notFound(c, "Booking session not found")
  })
  .patch("/sessions/:sessionId", async (c) => {
    const result = await publicBookingsService.updateSession(
      c.get("db"),
      c.req.param("sessionId"),
      await parseJsonBody(c, publicUpdateBookingSessionSchema),
      c.get("userId"),
    )

    if (result.status === "not_found") {
      return notFound(c, "Booking session not found")
    }

    if (!hasSessionResult(result)) {
      return c.json({ error: sessionConflictError(result.status) }, 409)
    }

    return c.json({ data: result.session })
  })
  .get("/sessions/:sessionId/state", async (c) => {
    const state = await publicBookingsService.getSessionState(c.get("db"), c.req.param("sessionId"))

    return state ? c.json({ data: state }) : notFound(c, "Booking session not found")
  })
  .put("/sessions/:sessionId/state", async (c) => {
    const result = await publicBookingsService.updateSessionState(
      c.get("db"),
      c.req.param("sessionId"),
      await parseJsonBody(c, publicUpsertBookingSessionStateSchema),
    )

    if (result.status === "not_found") {
      return notFound(c, "Booking session not found")
    }

    return c.json({ data: result.state })
  })
  .post("/sessions/:sessionId/reprice", async (c) => {
    const result = await publicBookingsService.repriceSession(
      c.get("db"),
      c.req.param("sessionId"),
      await parseJsonBody(c, publicRepriceBookingSessionSchema),
    )

    if (result.status === "not_found") {
      return notFound(c, "Booking session not found")
    }

    if (result.status === "invalid_selection") {
      return c.json({ error: "Booking session contains an invalid item selection" }, 400)
    }

    if (result.status !== "ok") {
      return c.json({ error: sessionConflictError(result.status) }, 409)
    }

    return c.json({
      data: {
        pricing: result.pricing,
        session: result.session,
      },
    })
  })
  .post("/sessions/:sessionId/confirm", async (c) => {
    const result = await publicBookingsService.confirmSession(
      c.get("db"),
      c.req.param("sessionId"),
      await parseJsonBody(c, publicBookingSessionMutationSchema),
      c.get("userId"),
    )

    if (result.status === "not_found") {
      return notFound(c, "Booking session not found")
    }

    if (!hasSessionResult(result)) {
      return c.json({ error: sessionConflictError(result.status) }, 409)
    }

    return c.json({ data: result.session })
  })
  .post("/sessions/:sessionId/expire", async (c) => {
    const result = await publicBookingsService.expireSession(
      c.get("db"),
      c.req.param("sessionId"),
      await parseJsonBody(c, publicBookingSessionMutationSchema),
      c.get("userId"),
    )

    if (result.status === "not_found") {
      return notFound(c, "Booking session not found")
    }

    if (!hasSessionResult(result)) {
      return c.json({ error: sessionConflictError(result.status) }, 409)
    }

    return c.json({ data: result.session })
  })
  .get("/overview", async (c) => {
    const overview = await publicBookingsService.getOverview(
      c.get("db"),
      await parseQuery(c, publicBookingOverviewLookupQuerySchema),
    )

    return overview ? c.json({ data: overview }) : notFound(c, "Booking overview not found")
  })

export type PublicBookingRoutes = typeof publicBookingRoutes
