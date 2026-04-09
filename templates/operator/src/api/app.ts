import { availabilityHonoModule } from "@voyantjs/availability"
import { bookingRequirementsHonoModule } from "@voyantjs/booking-requirements"
import { bookingsHonoModule, bookingsSupplierExtension } from "@voyantjs/bookings"
import { createCheckoutRoutes } from "@voyantjs/checkout"
import { crmBookingExtension, crmHonoModule } from "@voyantjs/crm"
import { distributionBookingExtension, distributionHonoModule } from "@voyantjs/distribution"
import { externalRefsHonoModule } from "@voyantjs/external-refs"
import { extrasHonoModule } from "@voyantjs/extras"
import { financeHonoModule } from "@voyantjs/finance"
import { createApp } from "@voyantjs/hono"
import { identityHonoModule } from "@voyantjs/identity"
import { legalHonoModule } from "@voyantjs/legal"
import { marketsHonoModule } from "@voyantjs/markets"
import {
  createDefaultNotificationProviders,
  createNotificationsHonoModule,
} from "@voyantjs/notifications"
import { pricingHonoModule } from "@voyantjs/pricing"
import { productsBookingExtension, productsHonoModule } from "@voyantjs/products"
import { resourcesHonoModule } from "@voyantjs/resources"
import { sellabilityHonoModule } from "@voyantjs/sellability"
import { suppliersHonoModule } from "@voyantjs/suppliers"
import { transactionsBookingExtension, transactionsHonoModule } from "@voyantjs/transactions"

import authHandler, { hasAuthPermission, resolveAuthRequest } from "./auth/handler"
import { getDbFromHyperdrive } from "./lib/db"

const resolveNotificationProviders = (env: Record<string, unknown>) =>
  createDefaultNotificationProviders(env, { emailProvider: "resend" })

const notificationsHonoModule = createNotificationsHonoModule({
  resolveProviders: resolveNotificationProviders,
})

export const app = createApp<CloudflareBindings>({
  db: (env) => getDbFromHyperdrive(env),
  modules: [
    crmHonoModule,
    availabilityHonoModule,
    identityHonoModule,
    notificationsHonoModule,
    externalRefsHonoModule,
    extrasHonoModule,
    bookingRequirementsHonoModule,
    pricingHonoModule,
    marketsHonoModule,
    transactionsHonoModule,
    resourcesHonoModule,
    sellabilityHonoModule,
    distributionHonoModule,
    suppliersHonoModule,
    productsHonoModule,
    bookingsHonoModule,
    financeHonoModule,
    legalHonoModule,
  ],
  extensions: [
    bookingsSupplierExtension,
    productsBookingExtension,
    crmBookingExtension,
    transactionsBookingExtension,
    distributionBookingExtension,
  ],
  auth: {
    handler: () => ({
      fetch: async (request, env, ctx) =>
        authHandler.fetch(request, env, ctx as ExecutionContext | undefined),
    }),
    resolve: async ({ request, env }) => resolveAuthRequest(request, env),
    hasPermission: async ({ request, env, permission }) =>
      hasAuthPermission(request, env, permission),
  },
  additionalRoutes: (hono) => {
    hono.route(
      "/",
      createCheckoutRoutes({
        resolveProviders: resolveNotificationProviders,
      }),
    )

    // POST /v1/uploads — upload file to R2, return { key, url, mimeType, size }
    hono.post("/v1/uploads", async (c) => {
      const bucket = c.env.MEDIA_BUCKET
      if (!bucket) {
        return c.json({ error: "Storage not configured" }, 503)
      }

      const body = await c.req.parseBody()
      const file = body.file
      if (!(file instanceof File)) {
        return c.json({ error: "Missing file field in multipart body" }, 400)
      }

      const ext = file.name.split(".").pop() ?? "bin"
      const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

      await bucket.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      })

      const appUrl = c.env.APP_URL?.replace(/\/api$/, "") ?? ""
      return c.json({
        key,
        url: `${appUrl}/api/v1/media/${key}`,
        mimeType: file.type,
        size: file.size,
      })
    })

    // GET /v1/media/:key{.+} — serve files from R2
    hono.get("/v1/media/*", async (c) => {
      const bucket = c.env.MEDIA_BUCKET
      if (!bucket) {
        return c.json({ error: "Storage not configured" }, 503)
      }

      const key = c.req.path.replace("/v1/media/", "")
      if (!key) {
        return c.json({ error: "Missing key" }, 400)
      }

      const object = await bucket.get(key)
      if (!object) {
        return c.json({ error: "Not found" }, 404)
      }

      const headers = new Headers()
      headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream")
      headers.set("Cache-Control", "public, max-age=31536000, immutable")
      if (object.size !== undefined) {
        headers.set("Content-Length", String(object.size))
      }

      return new Response(object.body, { headers })
    })
  },
})
