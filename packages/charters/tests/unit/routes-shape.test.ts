import { mountTestApp } from "@voyantjs/voyant-test-utils/http"
import { describe, expect, it } from "vitest"

import { chartersAdminRoutes } from "../../src/routes.js"
import { chartersPublicRoutes } from "../../src/routes-public.js"

describe("admin routes — invalid + external key handling", () => {
  const app = mountTestApp(chartersAdminRoutes, { db: undefined })

  it("returns 400 + invalid_key for non-typeid non-external", async () => {
    const res = await app.request("/products/not-a-typeid-and-not-external")
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("invalid_key")
  })

  it("returns 501 + external_not_supported_yet for external product key", async () => {
    const res = await app.request("/products/voyant-connect:cnx_abc")
    expect(res.status).toBe(501)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("external_not_supported_yet")
  })

  it("returns 501 on PUT external voyage key", async () => {
    const res = await app.request("/voyages/voyant-connect:cnx_abc", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    })
    expect(res.status).toBe(501)
  })
})

describe("admin routes — booking payload validation", () => {
  const app = mountTestApp(chartersAdminRoutes, { db: undefined })

  it("rejects per-suite booking when URL voyage key ≠ payload voyageId", async () => {
    const res = await app.request("/voyages/chrv_abc/bookings/per-suite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voyageId: "chrv_xyz",
        suiteId: "chst_def",
        currency: "USD",
        contact: { firstName: "A", lastName: "B" },
        guests: [{ firstName: "G1", lastName: "L1" }],
      }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("voyage_id_mismatch")
  })

  it("rejects whole-yacht booking when URL voyage key ≠ payload voyageId", async () => {
    const res = await app.request("/voyages/chrv_abc/bookings/whole-yacht", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voyageId: "chrv_xyz",
        currency: "USD",
        contact: { firstName: "A", lastName: "B" },
      }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("voyage_id_mismatch")
  })
})

describe("admin routes — MYBA endpoint without contracts service", () => {
  it("returns 501 + contracts_service_unavailable when chartersContractsService is unset", async () => {
    const app = mountTestApp(chartersAdminRoutes, { db: undefined })
    const res = await app.request("/bookings/book_abc/myba", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(501)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("contracts_service_unavailable")
  })
})

describe("public routes — key shape", () => {
  const app = mountTestApp(chartersPublicRoutes, { db: undefined })

  it("returns 400 invalid_key on /voyages/<bad>", async () => {
    const res = await app.request("/voyages/voyant-connect:cnx_abc")
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("invalid_key")
  })

  it("returns 400 invalid_key on /yachts/<bad>", async () => {
    const res = await app.request("/yachts/external:something")
    expect(res.status).toBe(400)
  })
})
