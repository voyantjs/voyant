import { Hono } from "hono"

import { type Env, notFound } from "./routes-shared.js"
import { publicBookingsService } from "./service-public.js"
import {
  publicBookingOverviewLookupQuerySchema,
  publicBookingSessionMutationSchema,
  publicCreateBookingSessionSchema,
  publicUpdateBookingSessionSchema,
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
      return "Booking session participant not found"
    default:
      return "Unable to process booking session"
  }
}

export const publicBookingRoutes = new Hono<Env>()
  .post("/sessions", async (c) => {
    const result = await publicBookingsService.createSession(
      c.get("db"),
      publicCreateBookingSessionSchema.parse(await c.req.json()),
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
      publicUpdateBookingSessionSchema.parse(await c.req.json()),
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
  .post("/sessions/:sessionId/confirm", async (c) => {
    const result = await publicBookingsService.confirmSession(
      c.get("db"),
      c.req.param("sessionId"),
      publicBookingSessionMutationSchema.parse(await c.req.json()),
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
      publicBookingSessionMutationSchema.parse(await c.req.json()),
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
      publicBookingOverviewLookupQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      ),
    )

    return overview ? c.json({ data: overview }) : notFound(c, "Booking overview not found")
  })

export type PublicBookingRoutes = typeof publicBookingRoutes
