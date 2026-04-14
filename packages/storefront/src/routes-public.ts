import { Hono } from "hono"

import { createStorefrontService, type StorefrontServiceOptions } from "./service.js"
import {
  storefrontDepartureListQuerySchema,
  storefrontDeparturePricePreviewInputSchema,
  storefrontProductExtensionsQuerySchema,
  storefrontPromotionalOfferListQuerySchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: unknown
  }
}

export function createStorefrontPublicRoutes(options?: StorefrontServiceOptions) {
  const storefrontService = createStorefrontService(options)

  return new Hono<Env>()
    .get("/settings", (c) => {
      return c.json({ data: storefrontService.getSettings() })
    })
    .get("/departures/:departureId", async (c) => {
      const departure = await storefrontService.getDeparture(
        c.get("db" as never),
        c.req.param("departureId"),
      )

      return departure
        ? c.json({ data: departure })
        : c.json({ error: "Storefront departure not found" }, 404)
    })
    .get("/products/:productId/departures", async (c) => {
      return c.json(
        await storefrontService.listProductDepartures(
          c.get("db" as never),
          c.req.param("productId"),
          storefrontDepartureListQuerySchema.parse(
            Object.fromEntries(new URL(c.req.url).searchParams),
          ),
        ),
      )
    })
    .post("/departures/:departureId/price", async (c) => {
      const preview = await storefrontService.previewDeparturePrice(
        c.get("db" as never),
        c.req.param("departureId"),
        storefrontDeparturePricePreviewInputSchema.parse(await c.req.json().catch(() => ({}))),
      )

      return preview
        ? c.json({ data: preview })
        : c.json({ error: "Storefront departure not found" }, 404)
    })
    .get("/products/:productId/extensions", async (c) => {
      return c.json({
        data: await storefrontService.getProductExtensions(
          c.get("db" as never),
          c.req.param("productId"),
          storefrontProductExtensionsQuerySchema.parse(
            Object.fromEntries(new URL(c.req.url).searchParams),
          ).optionId,
        ),
      })
    })
    .get("/products/:productId/departures/:departureId/itinerary", async (c) => {
      const itinerary = await storefrontService.getDepartureItinerary(c.get("db" as never), {
        departureId: c.req.param("departureId"),
        productId: c.req.param("productId"),
      })

      return itinerary
        ? c.json({ data: itinerary })
        : c.json({ error: "Storefront itinerary not found" }, 404)
    })
    .get("/products/:productId/offers", async (c) => {
      const query = storefrontPromotionalOfferListQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )

      return c.json({
        data: await storefrontService.listApplicableOffers({
          productId: c.req.param("productId"),
          departureId: query.departureId,
          locale: query.locale,
        }),
      })
    })
    .get("/offers/:slug", async (c) => {
      const query = storefrontPromotionalOfferListQuerySchema.parse(
        Object.fromEntries(new URL(c.req.url).searchParams),
      )
      const offer = await storefrontService.getOfferBySlug({
        slug: c.req.param("slug"),
        locale: query.locale,
      })

      return offer ? c.json({ data: offer }) : c.json({ error: "Storefront offer not found" }, 404)
    })
}

export type StorefrontPublicRoutes = ReturnType<typeof createStorefrontPublicRoutes>
