import { Hono } from "hono"
import { describe, expect, it } from "vitest"

import { createStorefrontPublicRoutes } from "../../src/routes-public.js"

describe("createStorefrontPublicRoutes", () => {
  it("returns normalized storefront settings", async () => {
    const app = new Hono().route(
      "/",
      createStorefrontPublicRoutes({
        settings: {
          branding: {
            logoUrl: "https://cdn.example.com/logo.svg",
            supportedLanguages: ["ro", "en"],
          },
          support: {
            email: "help@example.com",
            phone: "+40 723 123 456",
          },
          legal: {
            termsUrl: "https://example.com/terms",
            privacyUrl: "https://example.com/privacy",
            defaultContractTemplateId: "tmpl_123",
          },
          forms: {
            billing: {
              fields: [
                {
                  key: "email",
                  label: "Email",
                  type: "email",
                  required: true,
                  autocomplete: "email",
                },
              ],
            },
            passengers: {
              fields: [
                {
                  key: "passportNumber",
                  label: "Passport number",
                  placeholder: "AB123456",
                },
              ],
            },
          },
          payment: {
            defaultMethod: "card",
            methods: [
              { code: "card" },
              {
                code: "bank_transfer",
                label: "Wire transfer",
                description: "Use manual settlement for larger balances.",
              },
            ],
          },
        },
      }),
    )

    const res = await app.request("/settings")

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        branding: {
          logoUrl: "https://cdn.example.com/logo.svg",
          supportedLanguages: ["ro", "en"],
        },
        support: {
          email: "help@example.com",
          phone: "+40 723 123 456",
        },
        legal: {
          termsUrl: "https://example.com/terms",
          privacyUrl: "https://example.com/privacy",
          defaultContractTemplateId: "tmpl_123",
        },
        forms: {
          billing: {
            fields: [
              {
                key: "email",
                label: "Email",
                type: "email",
                required: true,
                placeholder: null,
                description: null,
                autocomplete: "email",
                options: [],
              },
            ],
          },
          passengers: {
            fields: [
              {
                key: "passportNumber",
                label: "Passport number",
                type: "text",
                required: false,
                placeholder: "AB123456",
                description: null,
                autocomplete: null,
                options: [],
              },
            ],
          },
        },
        payment: {
          defaultMethod: "card",
          methods: [
            {
              code: "card",
              label: "Card",
              description: null,
              enabled: true,
            },
            {
              code: "bank_transfer",
              label: "Wire transfer",
              description: "Use manual settlement for larger balances.",
              enabled: true,
            },
          ],
        },
      },
    })
  })

  it("fills missing storefront settings with stable defaults", async () => {
    const app = new Hono().route("/", createStorefrontPublicRoutes())

    const res = await app.request("/settings")

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        branding: {
          logoUrl: null,
          supportedLanguages: [],
        },
        support: {
          email: null,
          phone: null,
        },
        legal: {
          termsUrl: null,
          privacyUrl: null,
          defaultContractTemplateId: null,
        },
        forms: {
          billing: { fields: [] },
          passengers: { fields: [] },
        },
        payment: {
          defaultMethod: null,
          methods: [],
        },
      },
    })
  })

  it("returns applicable promotional offers from the injected resolver", async () => {
    const app = new Hono().route(
      "/",
      createStorefrontPublicRoutes({
        offers: {
          async listApplicableOffers({ productId, departureId, locale }) {
            expect(productId).toBe("prod_123")
            expect(departureId).toBe("dep_456")
            expect(locale).toBe("ro")

            return [
              {
                id: "offer_1",
                name: "Early booking",
                slug: "early-booking",
                description: "Save on early bookings.",
                discountType: "percentage",
                discountValue: "15",
                currency: null,
                applicableProductIds: ["prod_123"],
                applicableDepartureIds: ["dep_456"],
                validFrom: "2026-04-01T00:00:00.000Z",
                validTo: "2026-04-30T23:59:59.000Z",
                minPassengers: 2,
                imageMobileUrl: null,
                imageDesktopUrl: null,
                stackable: false,
                createdAt: "2026-04-01T00:00:00.000Z",
                updatedAt: "2026-04-01T00:00:00.000Z",
              },
            ]
          },
        },
      }),
    )

    const res = await app.request("/products/prod_123/offers?departureId=dep_456&locale=ro")

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: [
        {
          id: "offer_1",
          name: "Early booking",
          slug: "early-booking",
          description: "Save on early bookings.",
          discountType: "percentage",
          discountValue: "15",
          currency: null,
          applicableProductIds: ["prod_123"],
          applicableDepartureIds: ["dep_456"],
          validFrom: "2026-04-01T00:00:00.000Z",
          validTo: "2026-04-30T23:59:59.000Z",
          minPassengers: 2,
          imageMobileUrl: null,
          imageDesktopUrl: null,
          stackable: false,
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:00:00.000Z",
        },
      ],
    })
  })

  it("returns an offer by slug from the injected resolver", async () => {
    const app = new Hono().route(
      "/",
      createStorefrontPublicRoutes({
        offers: {
          async getOfferBySlug({ slug, locale }) {
            expect(slug).toBe("early-booking")
            expect(locale).toBe("en")

            return {
              id: "offer_1",
              name: "Early booking",
              slug: "early-booking",
              description: "Save on early bookings.",
              discountType: "percentage",
              discountValue: "15",
              currency: null,
              applicableProductIds: ["prod_123"],
              applicableDepartureIds: [],
              validFrom: "2026-04-01T00:00:00.000Z",
              validTo: "2026-04-30T23:59:59.000Z",
              minPassengers: null,
              imageMobileUrl: null,
              imageDesktopUrl: null,
              stackable: false,
              createdAt: "2026-04-01T00:00:00.000Z",
              updatedAt: "2026-04-01T00:00:00.000Z",
            }
          },
        },
      }),
    )

    const res = await app.request("/offers/early-booking?locale=en")

    expect(res.status).toBe(200)
    expect((await res.json()).data.slug).toBe("early-booking")
  })
})
