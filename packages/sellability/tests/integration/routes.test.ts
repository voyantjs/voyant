import { Hono } from "hono"
import { afterEach, describe, expect, it, vi } from "vitest"

import { sellabilityRoutes } from "../../src/routes.js"
import { sellabilityService } from "../../src/service.js"

describe("sellability routes", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createApp() {
    const app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, {} as never)
      c.set("userId" as never, "user_1")
      await next()
    })
    app.route("/", sellabilityRoutes)
    return app
  }

  it("constructs an offer bundle", async () => {
    vi.spyOn(sellabilityService, "constructOffer").mockResolvedValue({
      offer: { id: "offer_1" } as never,
      participants: [] as never[],
      items: [] as never[],
      itemParticipants: [] as never[],
      resolution: { product: { id: "prod_1", name: "City Escape" } } as never,
    })

    const app = createApp()
    const res = await app.request("/construct-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: {
          slotId: "slot_1",
          requestedUnits: [],
        },
        offer: {},
        participants: [],
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.offer.id).toBe("offer_1")
  })

  it("returns 404 when no matching sellable candidate exists", async () => {
    vi.spyOn(sellabilityService, "constructOffer").mockResolvedValue(null)

    const app = createApp()
    const res = await app.request("/construct-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: {
          slotId: "slot_missing",
          requestedUnits: [],
        },
        offer: {},
        participants: [],
      }),
    })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe("Sellable candidate not found")
  })
})
