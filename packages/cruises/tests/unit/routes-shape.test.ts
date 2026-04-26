import { mountTestApp } from "@voyantjs/voyant-test-utils/http"
import { describe, expect, it } from "vitest"

import { cruiseAdminRoutes } from "../../src/routes.js"

/**
 * Shape tests for the admin routes — verify that external/invalid keys are
 * rejected before the handler ever touches the database. We pass `db: undefined`
 * intentionally to surface any handler that fails to short-circuit on the key
 * check (those would crash trying to use `c.get("db")`).
 */

const app = mountTestApp(cruiseAdminRoutes, { db: undefined })

describe("admin routes — external key handling", () => {
  it("returns 501 on GET /:key with an external adapter key", async () => {
    const res = await app.request("/voyant-connect:cnx_abc123")
    expect(res.status).toBe(501)
    const body = (await res.json()) as { error: string; detail: string }
    expect(body.error).toBe("external_adapter_not_implemented")
    expect(body.detail).toContain("voyant-connect")
  })

  it("returns 409 on PUT /:key with an external adapter key", async () => {
    const res = await app.request("/voyant-connect:cnx_abc", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    })
    expect(res.status).toBe(409)
  })

  it("returns 409 on DELETE /:key with an external adapter key", async () => {
    const res = await app.request("/voyant-connect:cnx_abc", { method: "DELETE" })
    expect(res.status).toBe(409)
  })

  it("returns 501 on GET /sailings/:key with an external adapter key", async () => {
    const res = await app.request("/sailings/voyant-connect:cnx_abc")
    expect(res.status).toBe(501)
  })

  it("returns 409 on PUT /sailings/:key/pricing/bulk with external key", async () => {
    const res = await app.request("/sailings/voyant-connect:cnx_abc/pricing/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prices: [] }),
    })
    expect(res.status).toBe(409)
  })

  it("returns 501 on POST /sailings/:key/bookings with external key", async () => {
    const res = await app.request("/sailings/voyant-connect:cnx_abc/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(501)
  })

  it("returns 501 on POST /sailings/:key/party-bookings with external key", async () => {
    const res = await app.request("/sailings/voyant-connect:cnx_abc/party-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(501)
  })

  it("returns 501 on POST /:key/refresh with an external key", async () => {
    const res = await app.request("/voyant-connect:cnx_abc/refresh", { method: "POST" })
    expect(res.status).toBe(501)
  })

  it("returns 400 on POST /:key/refresh with a local key (refresh only valid for external)", async () => {
    const res = await app.request("/cru_abc123/refresh", { method: "POST" })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("local_cruise_no_refresh")
  })

  it("returns 400 on POST /:key/detach with a local key", async () => {
    const res = await app.request("/cru_abc123/detach", { method: "POST" })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("local_cruise_no_detach")
  })
})

describe("admin routes — invalid key handling", () => {
  it("returns 400 for malformed keys", async () => {
    const res = await app.request("/not-a-typeid-and-not-external")
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("invalid_key")
  })
})

describe("admin routes — search-index stubs (phase 4)", () => {
  it("returns 501 on PUT /search-index/bulk", async () => {
    const res = await app.request("/search-index/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: [] }),
    })
    expect(res.status).toBe(501)
  })

  it("returns 501 on POST /search-index/rebuild", async () => {
    const res = await app.request("/search-index/rebuild", { method: "POST" })
    expect(res.status).toBe(501)
  })
})
