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
})
