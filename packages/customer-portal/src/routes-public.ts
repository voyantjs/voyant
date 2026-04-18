import type { ModuleContainer } from "@voyantjs/core"
import { ForbiddenApiError, handleApiError, parseJsonBody, requireUserId } from "@voyantjs/hono"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { type Context, Hono } from "hono"

import {
  buildPublicCustomerPortalRouteRuntime,
  CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY,
  type PublicCustomerPortalRouteRuntime,
} from "./route-runtime.js"
import { customerPortalRoutes } from "./routes.js"
import { publicCustomerPortalService } from "./service-public.js"
import {
  bootstrapCustomerPortalSchema,
  createCustomerPortalCompanionSchema,
  importCustomerPortalBookingParticipantsSchema,
  updateCustomerPortalCompanionSchema,
  updateCustomerPortalProfileSchema,
} from "./validation-public.js"

type Env = {
  Bindings: Record<string, unknown>
  Variables: {
    container?: ModuleContainer
    db: PostgresJsDatabase
    userId?: string
  }
}

function notFound<T extends Env>(c: Context<T>, error: string) {
  return c.json({ error }, 404)
}

function hasErrorResult(
  value: { profile: unknown } | { error: "not_found" | "customer_record_required" },
): value is { error: "not_found" | "customer_record_required" } {
  return "error" in value
}

function hasBootstrapErrorResult(
  value:
    | { status: string; profile: unknown; candidates: unknown[] }
    | { error: "not_found" | "customer_record_not_found" | "customer_record_claimed" },
): value is { error: "not_found" | "customer_record_not_found" | "customer_record_claimed" } {
  return "error" in value
}

export interface PublicCustomerPortalRouteOptions {
  resolveDocumentDownloadUrl?: (
    bindings: unknown,
    storageKey: string,
  ) => Promise<string | null> | string | null
}

export function createPublicCustomerPortalRoutes(options: PublicCustomerPortalRouteOptions = {}) {
  const getRuntime = (c: Context<Env>) =>
    c.var.container?.resolve<PublicCustomerPortalRouteRuntime>(
      CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY,
    ) ?? buildPublicCustomerPortalRouteRuntime(c.env, options)

  const resolveOptionalKms = (c: Context<Env>) => getRuntime(c).getOptionalKmsProvider()

  const resolveDocumentDownloadUrl = (c: Context<Env>, storageKey: string) =>
    getRuntime(c).resolveDocumentDownloadUrl?.(storageKey) ?? null

  return new Hono<Env>()
    .route("/", customerPortalRoutes)
    .get("/me", async (c) => {
      const userId = requireUserId(c)

      const profile = await publicCustomerPortalService.getProfileWithOptions(c.get("db"), userId, {
        kms: resolveOptionalKms(c),
      })
      return profile ? c.json({ data: profile }) : notFound(c, "Customer profile not found")
    })
    .patch("/me", async (c) => {
      const userId = requireUserId(c)

      const result = await publicCustomerPortalService.updateProfileWithOptions(
        c.get("db"),
        userId,
        await parseJsonBody(c, updateCustomerPortalProfileSchema),
        {
          kms: resolveOptionalKms(c),
        },
      )

      if (hasErrorResult(result)) {
        if (result.error === "not_found") {
          return notFound(c, "Customer profile not found")
        }

        return c.json({ error: "Customer record is not linked to this account" }, 409)
      }

      return c.json({ data: result.profile })
    })
    .post("/bootstrap", async (c) => {
      const userId = requireUserId(c)

      const result = await publicCustomerPortalService.bootstrap(
        c.get("db"),
        userId,
        await parseJsonBody(c, bootstrapCustomerPortalSchema),
      )

      if (hasBootstrapErrorResult(result)) {
        if (result.error === "not_found") {
          return notFound(c, "Customer profile not found")
        }

        if (result.error === "customer_record_not_found") {
          return notFound(c, "Customer record not found")
        }

        return c.json({ error: "Customer record is already linked to another account" }, 409)
      }

      if (result.status === "customer_selection_required") {
        return c.json({ data: result }, 409)
      }

      return c.json({ data: result })
    })
    .get("/companions", async (c) => {
      const userId = requireUserId(c)

      return c.json({ data: await publicCustomerPortalService.listCompanions(c.get("db"), userId) })
    })
    .post("/companions", async (c) => {
      const userId = requireUserId(c)

      const companion = await publicCustomerPortalService.createCompanion(
        c.get("db"),
        userId,
        await parseJsonBody(c, createCustomerPortalCompanionSchema),
      )

      if (!companion) {
        return c.json({ error: "Customer record is not linked to this account" }, 409)
      }

      return c.json({ data: companion }, 201)
    })
    .post("/companions/import-booking-participants", async (c) => {
      const userId = requireUserId(c)

      const result = await publicCustomerPortalService.importBookingParticipantsAsCompanions(
        c.get("db"),
        userId,
        await parseJsonBody(c, importCustomerPortalBookingParticipantsSchema),
      )

      if (!result) {
        return c.json({ error: "Customer record is not linked to this account" }, 409)
      }

      return c.json({ data: result })
    })
    .patch("/companions/:companionId", async (c) => {
      const userId = requireUserId(c)

      const companion = await publicCustomerPortalService.updateCompanion(
        c.get("db"),
        userId,
        c.req.param("companionId"),
        await parseJsonBody(c, updateCustomerPortalCompanionSchema),
      )

      if (companion === "forbidden") {
        return handleApiError(
          new ForbiddenApiError("Companion does not belong to this customer"),
          c,
        )
      }

      if (!companion) {
        return notFound(c, "Companion not found")
      }

      return c.json({ data: companion })
    })
    .delete("/companions/:companionId", async (c) => {
      const userId = requireUserId(c)

      const result = await publicCustomerPortalService.deleteCompanion(
        c.get("db"),
        userId,
        c.req.param("companionId"),
      )

      if (result === "forbidden") {
        return handleApiError(
          new ForbiddenApiError("Companion does not belong to this customer"),
          c,
        )
      }

      if (result === "not_found") {
        return notFound(c, "Companion not found")
      }

      return c.json({ success: true })
    })
    .get("/bookings", async (c) => {
      const userId = requireUserId(c)

      const bookings = await publicCustomerPortalService.listBookings(c.get("db"), userId)
      return bookings ? c.json({ data: bookings }) : notFound(c, "Customer profile not found")
    })
    .get("/bookings/:bookingId", async (c) => {
      const userId = requireUserId(c)

      const booking = await publicCustomerPortalService.getBooking(
        c.get("db"),
        userId,
        c.req.param("bookingId"),
        {
          resolveDocumentDownloadUrl: (storageKey) => resolveDocumentDownloadUrl(c, storageKey),
        },
      )

      return booking ? c.json({ data: booking }) : notFound(c, "Booking not found")
    })
    .get("/bookings/:bookingId/documents", async (c) => {
      const userId = requireUserId(c)

      const documents = await publicCustomerPortalService.listBookingDocuments(
        c.get("db"),
        userId,
        c.req.param("bookingId"),
        {
          resolveDocumentDownloadUrl: (storageKey) => resolveDocumentDownloadUrl(c, storageKey),
        },
      )

      return documents ? c.json({ data: documents }) : notFound(c, "Booking not found")
    })
    .get("/bookings/:bookingId/billing-contact", async (c) => {
      const userId = requireUserId(c)

      const billingContact = await publicCustomerPortalService.getBookingBillingContact(
        c.get("db"),
        userId,
        c.req.param("bookingId"),
      )

      return billingContact ? c.json({ data: billingContact }) : notFound(c, "Booking not found")
    })
}

export const publicCustomerPortalRoutes = createPublicCustomerPortalRoutes()

export type PublicCustomerPortalRoutes = typeof publicCustomerPortalRoutes
