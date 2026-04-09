import { availabilityHonoModule } from "@voyantjs/availability"
import { bookingRequirementsHonoModule } from "@voyantjs/booking-requirements"
import { bookingsHonoModule, bookingsSupplierExtension } from "@voyantjs/bookings"
import { createCheckoutRoutes } from "@voyantjs/checkout"
import { crmBookingExtension, crmHonoModule } from "@voyantjs/crm"
import { distributionBookingExtension, distributionHonoModule } from "@voyantjs/distribution"
import { externalRefsHonoModule } from "@voyantjs/external-refs"
import { extrasHonoModule } from "@voyantjs/extras"
import { facilitiesHonoModule } from "@voyantjs/facilities"
import { financeHonoModule } from "@voyantjs/finance"
import { groundHonoModule } from "@voyantjs/ground"
import { createApp } from "@voyantjs/hono"
import { hospitalityHonoModule } from "@voyantjs/hospitality"
import { identityHonoModule } from "@voyantjs/identity"
import { marketsHonoModule } from "@voyantjs/markets"
import {
  createDefaultNotificationProviders,
  createNotificationsHonoModule,
} from "@voyantjs/notifications"
import { octoHonoModule } from "@voyantjs/octo"
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
    facilitiesHonoModule,
    hospitalityHonoModule,
    groundHonoModule,
    identityHonoModule,
    notificationsHonoModule,
    externalRefsHonoModule,
    extrasHonoModule,
    bookingRequirementsHonoModule,
    pricingHonoModule,
    marketsHonoModule,
    octoHonoModule,
    transactionsHonoModule,
    resourcesHonoModule,
    sellabilityHonoModule,
    distributionHonoModule,
    suppliersHonoModule,
    productsHonoModule,
    bookingsHonoModule,
    financeHonoModule,
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
  },
})
