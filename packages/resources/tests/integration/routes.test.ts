import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

let seq = 0
function nextSeq() {
  seq++
  return String(seq).padStart(4, "0")
}

describe.skipIf(!DB_AVAILABLE)("Resources routes (integration)", () => {
  let app: Hono
  // biome-ignore lint/suspicious/noExplicitAny: test db typing
  let db: any

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    const { resourcesRoutes } = await import("../../src/routes.js")

    db = createTestDb()
    await cleanupTestDb(db)

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user-id")
      await next()
    })
    app.route("/", resourcesRoutes)
  })

  beforeEach(async () => {
    seq = 0
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)
  })

  /* ── seed helpers ─────────────────────────────────────── */

  async function seedResource(overrides: Record<string, unknown> = {}) {
    const s = nextSeq()
    const res = await app.request("/resources", {
      method: "POST",
      ...json({
        kind: "guide",
        name: `Resource ${s}`,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedPool(overrides: Record<string, unknown> = {}) {
    const s = nextSeq()
    const res = await app.request("/pools", {
      method: "POST",
      ...json({
        kind: "guide",
        name: `Pool ${s}`,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedPoolMember(poolId: string, resourceId: string) {
    const res = await app.request("/pool-members", {
      method: "POST",
      ...json({ poolId, resourceId }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  /** Seed a product directly into DB (cross-module FK) */
  async function seedProductDirect() {
    const { products } = await import("@voyantjs/products/schema")
    const [row] = await db
      .insert(products)
      .values({ name: `Product ${nextSeq()}`, sellCurrency: "USD" })
      .returning()
    return row
  }

  /** Seed an availability slot directly into DB (cross-module FK) */
  async function seedAvailabilitySlotDirect(productId: string) {
    const { availabilitySlots } = await import("@voyantjs/availability/schema")
    const [row] = await db
      .insert(availabilitySlots)
      .values({
        productId,
        dateLocal: "2025-06-15",
        startsAt: new Date("2025-06-15T09:00:00Z"),
        timezone: "UTC",
      })
      .returning()
    return row
  }

  async function seedRequirement(
    poolId: string,
    productId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const res = await app.request("/requirements", {
      method: "POST",
      ...json({
        poolId,
        productId,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedSlotAssignment(slotId: string, overrides: Record<string, unknown> = {}) {
    const res = await app.request("/slot-assignments", {
      method: "POST",
      ...json({
        slotId,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedCloseout(resourceId: string, overrides: Record<string, unknown> = {}) {
    const res = await app.request("/closeouts", {
      method: "POST",
      ...json({
        resourceId,
        dateLocal: "2025-07-01",
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  /* ═══════════════════════════════════════════════════════
	   Resources
	   ═══════════════════════════════════════════════════════ */
  describe("Resources", () => {
    it("POST /resources → 201", async () => {
      const resource = await seedResource()
      expect(resource.id).toMatch(/^resc_/)
      expect(resource.kind).toBe("guide")
      expect(resource.name).toBe("Resource 0001")
      expect(resource.active).toBe(true)
    })

    it("GET /resources/:id → 200", async () => {
      const resource = await seedResource()
      const res = await app.request(`/resources/${resource.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(resource.id)
    })

    it("GET /resources/:id → 404 for missing", async () => {
      const res = await app.request("/resources/resc_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /resources/:id → 200", async () => {
      const resource = await seedResource()
      const res = await app.request(`/resources/${resource.id}`, {
        method: "PATCH",
        ...json({ name: "Updated", kind: "vehicle", capacity: 10 }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe("Updated")
      expect(body.data.kind).toBe("vehicle")
      expect(body.data.capacity).toBe(10)
    })

    it("PATCH /resources/:id → 404 for missing", async () => {
      const res = await app.request("/resources/resc_nonexistent", {
        method: "PATCH",
        ...json({ name: "Nope" }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /resources/:id → 200", async () => {
      const resource = await seedResource()
      const res = await app.request(`/resources/${resource.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
      const get = await app.request(`/resources/${resource.id}`)
      expect(get.status).toBe(404)
    })

    it("DELETE /resources/:id → 404 for missing", async () => {
      const res = await app.request("/resources/resc_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /resources → list with pagination", async () => {
      await seedResource()
      await seedResource()
      const res = await app.request("/resources?limit=1&offset=0")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(2)
    })

    it("GET /resources → filter by kind", async () => {
      await seedResource({ kind: "guide" })
      await seedResource({ kind: "vehicle" })
      const res = await app.request("/resources?kind=vehicle")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].kind).toBe("vehicle")
    })

    it("GET /resources → filter by active", async () => {
      await seedResource({ active: true })
      await seedResource({ active: false })
      const res = await app.request("/resources?active=false")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].active).toBe(false)
    })

    it("POST /resources/batch-update → 200", async () => {
      const r1 = await seedResource()
      const r2 = await seedResource()
      const res = await app.request("/resources/batch-update", {
        method: "POST",
        ...json({ ids: [r1.id, r2.id], patch: { active: false } }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
      expect(body.data).toHaveLength(2)
      for (const row of body.data) {
        expect(row.active).toBe(false)
      }
    })

    it("POST /resources/batch-update → partial failures", async () => {
      const r1 = await seedResource()
      const res = await app.request("/resources/batch-update", {
        method: "POST",
        ...json({ ids: [r1.id, "resc_nonexistent"], patch: { active: false } }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(1)
      expect(body.failed).toHaveLength(1)
      expect(body.failed[0].id).toBe("resc_nonexistent")
    })

    it("POST /resources/batch-delete → 200", async () => {
      const r1 = await seedResource()
      const r2 = await seedResource()
      const res = await app.request("/resources/batch-delete", {
        method: "POST",
        ...json({ ids: [r1.id, r2.id] }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
      expect(body.deletedIds).toHaveLength(2)
    })

    it("POST /resources/batch-delete → partial failures", async () => {
      const r1 = await seedResource()
      const res = await app.request("/resources/batch-delete", {
        method: "POST",
        ...json({ ids: [r1.id, "resc_nonexistent"] }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(1)
      expect(body.failed).toHaveLength(1)
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Resource Pools
	   ═══════════════════════════════════════════════════════ */
  describe("Resource Pools", () => {
    it("POST /pools → 201", async () => {
      const pool = await seedPool()
      expect(pool.id).toMatch(/^rspl_/)
      expect(pool.kind).toBe("guide")
      expect(pool.name).toBe("Pool 0001")
      expect(pool.active).toBe(true)
    })

    it("GET /pools/:id → 200", async () => {
      const pool = await seedPool()
      const res = await app.request(`/pools/${pool.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(pool.id)
    })

    it("GET /pools/:id → 404 for missing", async () => {
      const res = await app.request("/pools/rspl_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /pools/:id → 200", async () => {
      const pool = await seedPool()
      const res = await app.request(`/pools/${pool.id}`, {
        method: "PATCH",
        ...json({ name: "Updated Pool", sharedCapacity: 20 }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe("Updated Pool")
      expect(body.data.sharedCapacity).toBe(20)
    })

    it("PATCH /pools/:id → 404 for missing", async () => {
      const res = await app.request("/pools/rspl_nonexistent", {
        method: "PATCH",
        ...json({ name: "Nope" }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /pools/:id → 200", async () => {
      const pool = await seedPool()
      const res = await app.request(`/pools/${pool.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
      const get = await app.request(`/pools/${pool.id}`)
      expect(get.status).toBe(404)
    })

    it("DELETE /pools/:id → 404 for missing", async () => {
      const res = await app.request("/pools/rspl_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /pools → list with pagination", async () => {
      await seedPool()
      await seedPool()
      const res = await app.request("/pools?limit=1&offset=0")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(2)
    })

    it("GET /pools → filter by kind", async () => {
      await seedPool({ kind: "guide" })
      await seedPool({ kind: "vehicle" })
      const res = await app.request("/pools?kind=vehicle")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].kind).toBe("vehicle")
    })

    it("GET /pools → filter by active", async () => {
      await seedPool({ active: true })
      await seedPool({ active: false })
      const res = await app.request("/pools?active=false")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].active).toBe(false)
    })

    it("POST /pools/batch-update → 200", async () => {
      const p1 = await seedPool()
      const p2 = await seedPool()
      const res = await app.request("/pools/batch-update", {
        method: "POST",
        ...json({ ids: [p1.id, p2.id], patch: { active: false } }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
    })

    it("POST /pools/batch-delete → 200", async () => {
      const p1 = await seedPool()
      const p2 = await seedPool()
      const res = await app.request("/pools/batch-delete", {
        method: "POST",
        ...json({ ids: [p1.id, p2.id] }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Resource Pool Members
	   ═══════════════════════════════════════════════════════ */
  describe("Resource Pool Members", () => {
    it("POST /pool-members → 201", async () => {
      const resource = await seedResource()
      const pool = await seedPool()
      const member = await seedPoolMember(pool.id, resource.id)
      expect(member.id).toMatch(/^rspm_/)
      expect(member.poolId).toBe(pool.id)
      expect(member.resourceId).toBe(resource.id)
    })

    it("DELETE /pool-members/:id → 200", async () => {
      const resource = await seedResource()
      const pool = await seedPool()
      const member = await seedPoolMember(pool.id, resource.id)
      const res = await app.request(`/pool-members/${member.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /pool-members/:id → 404 for missing", async () => {
      const res = await app.request("/pool-members/rspm_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /pool-members → list by poolId", async () => {
      const r1 = await seedResource()
      const r2 = await seedResource()
      const pool = await seedPool()
      await seedPoolMember(pool.id, r1.id)
      await seedPoolMember(pool.id, r2.id)

      const res = await app.request(`/pool-members?poolId=${pool.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
      expect(body.total).toBe(2)
    })

    it("GET /pool-members → filter by resourceId", async () => {
      const r1 = await seedResource()
      const r2 = await seedResource()
      const pool = await seedPool()
      await seedPoolMember(pool.id, r1.id)
      await seedPoolMember(pool.id, r2.id)

      const res = await app.request(`/pool-members?resourceId=${r1.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].resourceId).toBe(r1.id)
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Resource Requirements
	   ═══════════════════════════════════════════════════════ */
  describe("Resource Requirements", () => {
    it("POST /requirements → 201", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const req = await seedRequirement(pool.id, product.id)
      expect(req.id).toMatch(/^rsrq_/)
      expect(req.poolId).toBe(pool.id)
      expect(req.productId).toBe(product.id)
      expect(req.quantityRequired).toBe(1)
      expect(req.allocationMode).toBe("shared")
    })

    it("GET /requirements/:id → 200", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const req = await seedRequirement(pool.id, product.id)
      const res = await app.request(`/requirements/${req.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(req.id)
    })

    it("GET /requirements/:id → 404 for missing", async () => {
      const res = await app.request("/requirements/rsrq_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /requirements/:id → 200", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const req = await seedRequirement(pool.id, product.id)
      const res = await app.request(`/requirements/${req.id}`, {
        method: "PATCH",
        ...json({ quantityRequired: 3, allocationMode: "exclusive", priority: 5 }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.quantityRequired).toBe(3)
      expect(body.data.allocationMode).toBe("exclusive")
      expect(body.data.priority).toBe(5)
    })

    it("PATCH /requirements/:id → 404 for missing", async () => {
      const res = await app.request("/requirements/rsrq_nonexistent", {
        method: "PATCH",
        ...json({ quantityRequired: 5 }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /requirements/:id → 200", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const req = await seedRequirement(pool.id, product.id)
      const res = await app.request(`/requirements/${req.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /requirements/:id → 404 for missing", async () => {
      const res = await app.request("/requirements/rsrq_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /requirements → list with filters", async () => {
      const product = await seedProductDirect()
      const p1 = await seedPool()
      const p2 = await seedPool()
      await seedRequirement(p1.id, product.id)
      await seedRequirement(p2.id, product.id)

      const res = await app.request(`/requirements?poolId=${p1.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
    })

    it("GET /requirements → filter by productId", async () => {
      const prod1 = await seedProductDirect()
      const prod2 = await seedProductDirect()
      const pool = await seedPool()
      await seedRequirement(pool.id, prod1.id)
      await seedRequirement(pool.id, prod2.id)

      const res = await app.request(`/requirements?productId=${prod1.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].productId).toBe(prod1.id)
    })

    it("POST /requirements/batch-update → 200", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const r1 = await seedRequirement(pool.id, product.id)
      const r2 = await seedRequirement(pool.id, product.id, { priority: 1 })
      const res = await app.request("/requirements/batch-update", {
        method: "POST",
        ...json({ ids: [r1.id, r2.id], patch: { priority: 10 } }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
    })

    it("POST /requirements/batch-delete → 200", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const r1 = await seedRequirement(pool.id, product.id)
      const r2 = await seedRequirement(pool.id, product.id, { priority: 1 })
      const res = await app.request("/requirements/batch-delete", {
        method: "POST",
        ...json({ ids: [r1.id, r2.id] }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Allocations (alias for Requirements)
	   ═══════════════════════════════════════════════════════ */
  describe("Allocations (alias)", () => {
    it("POST /allocations → 201", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const res = await app.request("/allocations", {
        method: "POST",
        ...json({ poolId: pool.id, productId: product.id }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.id).toMatch(/^rsrq_/)
    })

    it("GET /allocations/:id → 200", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const req = await seedRequirement(pool.id, product.id)
      const res = await app.request(`/allocations/${req.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(req.id)
    })

    it("PATCH /allocations/:id → 200", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const req = await seedRequirement(pool.id, product.id)
      const res = await app.request(`/allocations/${req.id}`, {
        method: "PATCH",
        ...json({ priority: 99 }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.priority).toBe(99)
    })

    it("DELETE /allocations/:id → 200", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      const req = await seedRequirement(pool.id, product.id)
      const res = await app.request(`/allocations/${req.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("GET /allocations → list", async () => {
      const product = await seedProductDirect()
      const pool = await seedPool()
      await seedRequirement(pool.id, product.id)
      const res = await app.request("/allocations")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Slot Assignments
	   ═══════════════════════════════════════════════════════ */
  describe("Slot Assignments", () => {
    it("POST /slot-assignments → 201", async () => {
      const product = await seedProductDirect()
      const slot = await seedAvailabilitySlotDirect(product.id)
      const assignment = await seedSlotAssignment(slot.id)
      expect(assignment.id).toMatch(/^rssa_/)
      expect(assignment.slotId).toBe(slot.id)
      expect(assignment.status).toBe("reserved")
    })

    it("GET /slot-assignments/:id → 200", async () => {
      const product = await seedProductDirect()
      const slot = await seedAvailabilitySlotDirect(product.id)
      const assignment = await seedSlotAssignment(slot.id)
      const res = await app.request(`/slot-assignments/${assignment.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(assignment.id)
    })

    it("GET /slot-assignments/:id → 404 for missing", async () => {
      const res = await app.request("/slot-assignments/rssa_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /slot-assignments/:id → 200", async () => {
      const product = await seedProductDirect()
      const slot = await seedAvailabilitySlotDirect(product.id)
      const assignment = await seedSlotAssignment(slot.id)
      const res = await app.request(`/slot-assignments/${assignment.id}`, {
        method: "PATCH",
        ...json({ status: "assigned", notes: "Confirmed" }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.status).toBe("assigned")
      expect(body.data.notes).toBe("Confirmed")
    })

    it("PATCH /slot-assignments/:id → 404 for missing", async () => {
      const res = await app.request("/slot-assignments/rssa_nonexistent", {
        method: "PATCH",
        ...json({ status: "assigned" }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /slot-assignments/:id → 200", async () => {
      const product = await seedProductDirect()
      const slot = await seedAvailabilitySlotDirect(product.id)
      const assignment = await seedSlotAssignment(slot.id)
      const res = await app.request(`/slot-assignments/${assignment.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /slot-assignments/:id → 404 for missing", async () => {
      const res = await app.request("/slot-assignments/rssa_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /slot-assignments → list with filters", async () => {
      const product = await seedProductDirect()
      const s1 = await seedAvailabilitySlotDirect(product.id)
      const s2 = await seedAvailabilitySlotDirect(product.id)
      await seedSlotAssignment(s1.id)
      await seedSlotAssignment(s2.id)

      const res = await app.request(`/slot-assignments?slotId=${s1.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
    })

    it("GET /slot-assignments → filter by status", async () => {
      const product = await seedProductDirect()
      const slot = await seedAvailabilitySlotDirect(product.id)
      await seedSlotAssignment(slot.id, { status: "reserved" })
      await seedSlotAssignment(slot.id, { status: "assigned" })

      const res = await app.request("/slot-assignments?status=assigned")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].status).toBe("assigned")
    })

    it("POST /slot-assignments/batch-update → 200", async () => {
      const product = await seedProductDirect()
      const slot = await seedAvailabilitySlotDirect(product.id)
      const a1 = await seedSlotAssignment(slot.id)
      const a2 = await seedSlotAssignment(slot.id)
      const res = await app.request("/slot-assignments/batch-update", {
        method: "POST",
        ...json({ ids: [a1.id, a2.id], patch: { status: "completed" } }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
    })

    it("POST /slot-assignments/batch-delete → 200", async () => {
      const product = await seedProductDirect()
      const slot = await seedAvailabilitySlotDirect(product.id)
      const a1 = await seedSlotAssignment(slot.id)
      const a2 = await seedSlotAssignment(slot.id)
      const res = await app.request("/slot-assignments/batch-delete", {
        method: "POST",
        ...json({ ids: [a1.id, a2.id] }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Resource Closeouts
	   ═══════════════════════════════════════════════════════ */
  describe("Resource Closeouts", () => {
    it("POST /closeouts → 201", async () => {
      const resource = await seedResource()
      const closeout = await seedCloseout(resource.id)
      expect(closeout.id).toMatch(/^rscl_/)
      expect(closeout.resourceId).toBe(resource.id)
      expect(closeout.dateLocal).toBe("2025-07-01")
    })

    it("GET /closeouts/:id → 200", async () => {
      const resource = await seedResource()
      const closeout = await seedCloseout(resource.id)
      const res = await app.request(`/closeouts/${closeout.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(closeout.id)
    })

    it("GET /closeouts/:id → 404 for missing", async () => {
      const res = await app.request("/closeouts/rscl_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /closeouts/:id → 200", async () => {
      const resource = await seedResource()
      const closeout = await seedCloseout(resource.id)
      const res = await app.request(`/closeouts/${closeout.id}`, {
        method: "PATCH",
        ...json({ reason: "Maintenance", dateLocal: "2025-07-02" }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.reason).toBe("Maintenance")
    })

    it("PATCH /closeouts/:id → 404 for missing", async () => {
      const res = await app.request("/closeouts/rscl_nonexistent", {
        method: "PATCH",
        ...json({ reason: "Nope" }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /closeouts/:id → 200", async () => {
      const resource = await seedResource()
      const closeout = await seedCloseout(resource.id)
      const res = await app.request(`/closeouts/${closeout.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /closeouts/:id → 404 for missing", async () => {
      const res = await app.request("/closeouts/rscl_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /closeouts → list with filters", async () => {
      const r1 = await seedResource()
      const r2 = await seedResource()
      await seedCloseout(r1.id)
      await seedCloseout(r1.id, { dateLocal: "2025-07-02" })
      await seedCloseout(r2.id)

      const res = await app.request(`/closeouts?resourceId=${r1.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
      expect(body.total).toBe(2)
    })

    it("GET /closeouts → filter by dateLocal", async () => {
      const resource = await seedResource()
      await seedCloseout(resource.id, { dateLocal: "2025-07-01" })
      await seedCloseout(resource.id, { dateLocal: "2025-07-02" })

      const res = await app.request("/closeouts?dateLocal=2025-07-02")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].dateLocal).toBe("2025-07-02")
    })

    it("POST /closeouts/batch-update → 200", async () => {
      const resource = await seedResource()
      const c1 = await seedCloseout(resource.id)
      const c2 = await seedCloseout(resource.id, { dateLocal: "2025-07-02" })
      const res = await app.request("/closeouts/batch-update", {
        method: "POST",
        ...json({ ids: [c1.id, c2.id], patch: { reason: "Batch reason" } }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
    })

    it("POST /closeouts/batch-delete → 200", async () => {
      const resource = await seedResource()
      const c1 = await seedCloseout(resource.id)
      const c2 = await seedCloseout(resource.id, { dateLocal: "2025-07-02" })
      const res = await app.request("/closeouts/batch-delete", {
        method: "POST",
        ...json({ ids: [c1.id, c2.id] }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.succeeded).toBe(2)
    })
  })
})
