import { availabilityHonoModule } from "@voyantjs/availability"
import { bookingRequirementsHonoModule } from "@voyantjs/booking-requirements"
import { bookingsHonoModule, bookingsSupplierExtension } from "@voyantjs/bookings"
import { createCheckoutHonoModule } from "@voyantjs/checkout"
import { crmBookingExtension, crmHonoModule } from "@voyantjs/crm"
import { customerPortalHonoModule } from "@voyantjs/customer-portal"
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
import { createStorefrontVerificationHonoModule } from "@voyantjs/storefront-verification"
import { suppliersHonoModule } from "@voyantjs/suppliers"
import { transactionsBookingExtension, transactionsHonoModule } from "@voyantjs/transactions"

import authHandler, { hasAuthPermission, resolveAuthRequest } from "./auth/handler"
import { getDbFromHyperdrive } from "./lib/db"
import { createMediaStorage, guessMimeType } from "./lib/storage"

const resolveNotificationProviders = (env: Record<string, unknown>) =>
  createDefaultNotificationProviders(env, {
    emailProvider: "resend",
    smsProvider: "twilio",
  })

const notificationsHonoModule = createNotificationsHonoModule({
  resolveProviders: resolveNotificationProviders,
})
const storefrontVerificationHonoModule = createStorefrontVerificationHonoModule({
  resolveProviders: resolveNotificationProviders,
  email: {
    subject: "Your verification code",
  },
})
const checkoutHonoModule = createCheckoutHonoModule({
  resolveProviders: resolveNotificationProviders,
})

export const app = createApp<CloudflareBindings>({
  db: (env) => getDbFromHyperdrive(env),
  publicPaths: [
    "/v1/customer-portal/contact-exists",
    "/v1/storefront-verification",
    "/v1/checkout",
  ],
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
    customerPortalHonoModule,
    storefrontVerificationHonoModule,
    checkoutHonoModule,
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
    // POST /v1/uploads — upload file via the configured StorageProvider
    // (swap the provider in src/lib/storage.ts to use S3, GCS, etc.)
    hono.post("/v1/uploads", async (c) => {
      const storage = createMediaStorage(c.env)
      if (!storage) {
        return c.json({ error: "Storage not configured" }, 503)
      }

      const body = await c.req.parseBody()
      const file = body.file
      if (!(file instanceof File)) {
        return c.json({ error: "Missing file field in multipart body" }, 400)
      }

      const ext = file.name.split(".").pop() ?? "bin"
      const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

      const result = await storage.upload(await file.arrayBuffer(), {
        key,
        contentType: file.type,
      })

      return c.json({
        key: result.key,
        url: result.url,
        mimeType: file.type,
        size: file.size,
      })
    })

    // GET /v1/media/* — serve files via the configured StorageProvider
    hono.get("/v1/media/*", async (c) => {
      const storage = createMediaStorage(c.env)
      if (!storage) {
        return c.json({ error: "Storage not configured" }, 503)
      }

      const key = c.req.path.replace("/v1/media/", "")
      if (!key) {
        return c.json({ error: "Missing key" }, 400)
      }

      const buffer = await storage.get(key)
      if (!buffer) {
        return c.json({ error: "Not found" }, 404)
      }

      const headers = new Headers()
      headers.set("Content-Type", guessMimeType(key))
      headers.set("Cache-Control", "public, max-age=31536000, immutable")
      headers.set("Content-Length", String(buffer.byteLength))

      return new Response(buffer, { headers })
    })
  },
})
