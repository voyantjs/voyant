import { eq, sql } from "drizzle-orm"
import { Hono } from "hono"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { offerParticipants, orderParticipants, transactionPiiAccessLog } from "../../src/schema.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL
const ORIGINAL_TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

function getIsolatedTransactionsTestDbUrl(url: string | undefined) {
  if (!url) return url

  try {
    const parsed = new URL(url)
    if (parsed.hostname === "127.0.0.1" && parsed.pathname === "/voyant_test") {
      parsed.pathname = "/voyant_transactions_test"
      return parsed.toString()
    }
  } catch {
    return url
  }

  return url
}

const json = (body: Record<string, unknown>) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

let seq = 0
function nextSeq() {
  seq++
  return String(seq).padStart(4, "0")
}

function nextRef(prefix: string, seq: string) {
  const s = seq
  return `${prefix}-${Date.now()}-${s}`
}

async function cleanupTransactionsTestData(
  // biome-ignore lint/suspicious/noExplicitAny: test db typing
  db: any,
) {
  await db.execute(sql`
    TRUNCATE
      offer_item_participants,
      order_item_participants,
      order_terms,
      offer_items,
      order_items,
      offer_participants,
      order_participants,
      offers,
      orders,
      transaction_pii_access_log
  `)
}

describe.skipIf(!DB_AVAILABLE)("Transactions routes (integration)", () => {
  let app: Hono
  // biome-ignore lint/suspicious/noExplicitAny: test db typing
  let db: any

  beforeAll(async () => {
    process.env.TEST_DATABASE_URL = getIsolatedTransactionsTestDbUrl(process.env.TEST_DATABASE_URL)
    const { createTestDb } = await import("@voyantjs/db/test-utils")
    const { transactionsRoutes } = await import("../../src/routes.js")
    const { generateEnvKmsKey } = await import("@voyantjs/utils")

    db = createTestDb()
    await db.execute(sql`
      DO $$
      BEGIN
        CREATE TYPE transaction_pii_access_action AS ENUM ('read', 'update', 'delete');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await db.execute(sql`
      DO $$
      BEGIN
        CREATE TYPE transaction_pii_access_outcome AS ENUM ('allowed', 'denied');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await db.execute(sql`
      ALTER TABLE offer_participants
      ADD COLUMN IF NOT EXISTS identity_encrypted jsonb
    `)
    await db.execute(sql`
      ALTER TABLE order_participants
      ADD COLUMN IF NOT EXISTS identity_encrypted jsonb
    `)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transaction_pii_access_log (
        id text PRIMARY KEY NOT NULL,
        participant_kind text NOT NULL,
        parent_id text,
        participant_id text,
        actor_id text,
        actor_type text,
        caller_type text,
        action transaction_pii_access_action NOT NULL,
        outcome transaction_pii_access_outcome NOT NULL,
        reason text,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `)
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_transaction_pii_access_log_parent ON transaction_pii_access_log (parent_id)`,
    )
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_transaction_pii_access_log_participant ON transaction_pii_access_log (participant_id)`,
    )
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_transaction_pii_access_log_actor ON transaction_pii_access_log (actor_id)`,
    )
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_transaction_pii_access_log_created_at ON transaction_pii_access_log (created_at)`,
    )
    process.env.KMS_PROVIDER = "env"
    process.env.KMS_ENV_KEY = generateEnvKmsKey()
    await cleanupTransactionsTestData(db)

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user-id")
      c.set("actor" as never, "staff")
      await next()
    })
    app.route("/", transactionsRoutes)
  })

  beforeEach(async () => {
    seq = 0
    await cleanupTransactionsTestData(db)
  })

  afterAll(async () => {
    const { closeTestDb } = await import("@voyantjs/db/test-utils")
    delete process.env.KMS_PROVIDER
    delete process.env.KMS_ENV_KEY
    process.env.TEST_DATABASE_URL = ORIGINAL_TEST_DATABASE_URL
    await closeTestDb()
  })

  /* ── seed helpers ─────────────────────────────────────── */

  async function seedOffer(overrides: Record<string, unknown> = {}) {
    const s = nextSeq()
    const res = await app.request("/offers", {
      method: "POST",
      ...json({
        offerNumber: nextRef("OFF", s),
        title: `Offer ${s}`,
        currency: "USD",
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedOfferParticipant(offerId: string, overrides: Record<string, unknown> = {}) {
    const s = nextSeq()
    const res = await app.request("/offer-participants", {
      method: "POST",
      ...json({
        offerId,
        firstName: `First${s}`,
        lastName: `Last${s}`,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedOfferItem(offerId: string, overrides: Record<string, unknown> = {}) {
    const s = nextSeq()
    const res = await app.request("/offer-items", {
      method: "POST",
      ...json({
        offerId,
        title: `Item ${s}`,
        sellCurrency: "USD",
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedOfferItemParticipant(
    offerItemId: string,
    participantId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const res = await app.request("/offer-item-participants", {
      method: "POST",
      ...json({
        offerItemId,
        participantId,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedOrder(overrides: Record<string, unknown> = {}) {
    const s = nextSeq()
    const res = await app.request("/orders", {
      method: "POST",
      ...json({
        orderNumber: nextRef("ORD", s),
        title: `Order ${s}`,
        currency: "USD",
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedOrderParticipant(orderId: string, overrides: Record<string, unknown> = {}) {
    const s = nextSeq()
    const res = await app.request("/order-participants", {
      method: "POST",
      ...json({
        orderId,
        firstName: `First${s}`,
        lastName: `Last${s}`,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedOrderItem(orderId: string, overrides: Record<string, unknown> = {}) {
    const s = nextSeq()
    const res = await app.request("/order-items", {
      method: "POST",
      ...json({
        orderId,
        title: `Item ${s}`,
        sellCurrency: "USD",
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedOrderItemParticipant(
    orderItemId: string,
    participantId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const res = await app.request("/order-item-participants", {
      method: "POST",
      ...json({
        orderItemId,
        participantId,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  async function seedOrderTerm(
    parentId: { offerId?: string; orderId?: string },
    overrides: Record<string, unknown> = {},
  ) {
    const s = nextSeq()
    const res = await app.request("/order-terms", {
      method: "POST",
      ...json({
        ...parentId,
        title: `Term ${s}`,
        body: `Body of term ${s}`,
        ...overrides,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    return body.data
  }

  /* ═══════════════════════════════════════════════════════
	   Offers
	   ═══════════════════════════════════════════════════════ */
  describe("Offers", () => {
    it("POST /offers → 201", async () => {
      const offer = await seedOffer()
      expect(offer.id).toMatch(/^offr_/)
      expect(offer.offerNumber).toMatch(/^OFF-\d{13}-0001$/)
      expect(offer.title).toBe("Offer 0001")
      expect(offer.currency).toBe("USD")
      expect(offer.status).toBe("draft")
    })

    it("GET /offers/:id → 200", async () => {
      const offer = await seedOffer()
      const res = await app.request(`/offers/${offer.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(offer.id)
    })

    it("GET /offers/:id → 404 for missing", async () => {
      const res = await app.request("/offers/offr_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /offers/:id → 200", async () => {
      const offer = await seedOffer()
      const res = await app.request(`/offers/${offer.id}`, {
        method: "PATCH",
        ...json({ title: "Updated Offer", status: "published", totalAmountCents: 50000 }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe("Updated Offer")
      expect(body.data.status).toBe("published")
      expect(body.data.totalAmountCents).toBe(50000)
    })

    it("PATCH /offers/:id → 404 for missing", async () => {
      const res = await app.request("/offers/offr_nonexistent", {
        method: "PATCH",
        ...json({ title: "Nope" }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /offers/:id → 200", async () => {
      const offer = await seedOffer()
      const res = await app.request(`/offers/${offer.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
      const get = await app.request(`/offers/${offer.id}`)
      expect(get.status).toBe(404)
    })

    it("DELETE /offers/:id → 404 for missing", async () => {
      const res = await app.request("/offers/offr_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /offers → list with pagination", async () => {
      await seedOffer()
      await seedOffer()
      const res = await app.request("/offers?limit=1&offset=0")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(2)
    })

    it("GET /offers → filter by status", async () => {
      await seedOffer({ status: "draft" })
      await seedOffer({ status: "published" })
      const res = await app.request("/offers?status=published")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].status).toBe("published")
    })

    it("GET /offers → search by title", async () => {
      await seedOffer({ title: "Alpha Trip" })
      await seedOffer({ title: "Beta Tour" })
      const res = await app.request("/offers?search=Alpha")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].title).toBe("Alpha Trip")
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Offer Participants
	   ═══════════════════════════════════════════════════════ */
  describe("Offer Participants", () => {
    it("POST /offer-participants → 201", async () => {
      const offer = await seedOffer()
      const participant = await seedOfferParticipant(offer.id)
      expect(participant.id).toMatch(/^ofpt_/)
      expect(participant.offerId).toBe(offer.id)
      expect(participant.participantType).toBe("traveler")
      expect(participant.isPrimary).toBe(false)
    })

    it("GET /offer-participants/:id → 200", async () => {
      const offer = await seedOffer()
      const participant = await seedOfferParticipant(offer.id)
      const res = await app.request(`/offer-participants/${participant.id}`)
      expect(res.status).toBe(200)
    })

    it("GET /offer-participants/:id → 404 for missing", async () => {
      const res = await app.request("/offer-participants/ofpt_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /offer-participants/:id → 200", async () => {
      const offer = await seedOffer()
      const participant = await seedOfferParticipant(offer.id)
      const res = await app.request(`/offer-participants/${participant.id}`, {
        method: "PATCH",
        ...json({ isPrimary: true, participantType: "booker" }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.isPrimary).toBe(true)
      expect(body.data.participantType).toBe("booker")
    })

    it("PATCH /offer-participants/:id → 404 for missing", async () => {
      const res = await app.request("/offer-participants/ofpt_nonexistent", {
        method: "PATCH",
        ...json({ isPrimary: true }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /offer-participants/:id → 200", async () => {
      const offer = await seedOffer()
      const participant = await seedOfferParticipant(offer.id)
      const res = await app.request(`/offer-participants/${participant.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /offer-participants/:id → 404 for missing", async () => {
      const res = await app.request("/offer-participants/ofpt_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /offer-participants → list by offerId", async () => {
      const o1 = await seedOffer()
      const o2 = await seedOffer()
      await seedOfferParticipant(o1.id)
      await seedOfferParticipant(o1.id)
      await seedOfferParticipant(o2.id)

      const res = await app.request(`/offer-participants?offerId=${o1.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
      expect(body.total).toBe(2)
    })

    it("stores offer participant travel identity encrypted and keeps generic responses non-sensitive", async () => {
      const offer = await seedOffer()
      const res = await app.request("/offer-participants", {
        method: "POST",
        ...json({
          offerId: offer.id,
          firstName: "Ana",
          lastName: "Traveler",
          dateOfBirth: "1990-02-03",
          nationality: "RO",
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.hasTravelIdentity).toBe(true)
      expect(body.data).not.toHaveProperty("dateOfBirth")
      expect(body.data).not.toHaveProperty("nationality")

      const [stored] = await db
        .select()
        .from(offerParticipants)
        .where(eq(offerParticipants.id, body.data.id))

      expect(stored.identityEncrypted?.enc).toMatch(/^env:v1:/)
      expect(stored.identityEncrypted?.enc).not.toContain("1990-02-03")

      const detailsRes = await app.request(`/offer-participants/${body.data.id}/travel-details`)
      expect(detailsRes.status).toBe(200)
      const details = await detailsRes.json()
      expect(details.data.dateOfBirth).toBe("1990-02-03")
      expect(details.data.nationality).toBe("RO")
    })

    it("audits denied offer participant pii reads", async () => {
      const offer = await seedOffer()
      const participant = await seedOfferParticipant(offer.id)
      await app.request(`/offer-participants/${participant.id}/travel-details`, {
        method: "PATCH",
        ...json({ nationality: "RO" }),
      })

      const restrictedApp = new Hono()
      restrictedApp.use("*", async (c, next) => {
        c.set("db" as never, db)
        c.set("userId" as never, "test-customer-id")
        c.set("actor" as never, "customer")
        await next()
      })
      restrictedApp.route("/", (await import("../../src/routes.js")).transactionsRoutes)

      const denied = await restrictedApp.request(
        `/offer-participants/${participant.id}/travel-details`,
      )
      expect(denied.status).toBe(403)

      const rows = await db
        .select()
        .from(transactionPiiAccessLog)
        .where(eq(transactionPiiAccessLog.participantId, participant.id))

      expect(
        rows.some(
          (row: { outcome: string; reason: string | null; participantKind: string }) =>
            row.outcome === "denied" &&
            row.reason === "insufficient_scope" &&
            row.participantKind === "offer",
        ),
      ).toBe(true)
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Offer Items
	   ═══════════════════════════════════════════════════════ */
  describe("Offer Items", () => {
    it("POST /offer-items → 201", async () => {
      const offer = await seedOffer()
      const item = await seedOfferItem(offer.id)
      expect(item.id).toMatch(/^ofit_/)
      expect(item.offerId).toBe(offer.id)
      expect(item.itemType).toBe("unit")
      expect(item.status).toBe("draft")
      expect(item.quantity).toBe(1)
    })

    it("GET /offer-items/:id → 200", async () => {
      const offer = await seedOffer()
      const item = await seedOfferItem(offer.id)
      const res = await app.request(`/offer-items/${item.id}`)
      expect(res.status).toBe(200)
    })

    it("GET /offer-items/:id → 404 for missing", async () => {
      const res = await app.request("/offer-items/ofit_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /offer-items/:id → 200", async () => {
      const offer = await seedOffer()
      const item = await seedOfferItem(offer.id)
      const res = await app.request(`/offer-items/${item.id}`, {
        method: "PATCH",
        ...json({ status: "priced", quantity: 3, unitSellAmountCents: 1500 }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.status).toBe("priced")
      expect(body.data.quantity).toBe(3)
      expect(body.data.unitSellAmountCents).toBe(1500)
    })

    it("PATCH /offer-items/:id → 404 for missing", async () => {
      const res = await app.request("/offer-items/ofit_nonexistent", {
        method: "PATCH",
        ...json({ quantity: 5 }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /offer-items/:id → 200", async () => {
      const offer = await seedOffer()
      const item = await seedOfferItem(offer.id)
      const res = await app.request(`/offer-items/${item.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /offer-items/:id → 404 for missing", async () => {
      const res = await app.request("/offer-items/ofit_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /offer-items → list by offerId", async () => {
      const offer = await seedOffer()
      await seedOfferItem(offer.id)
      await seedOfferItem(offer.id)

      const res = await app.request(`/offer-items?offerId=${offer.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
    })

    it("GET /offer-items → filter by status", async () => {
      const offer = await seedOffer()
      await seedOfferItem(offer.id, { status: "draft" })
      await seedOfferItem(offer.id, { status: "priced" })

      const res = await app.request("/offer-items?status=priced")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].status).toBe("priced")
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Offer Item Participants
	   ═══════════════════════════════════════════════════════ */
  describe("Offer Item Participants", () => {
    it("POST /offer-item-participants → 201", async () => {
      const offer = await seedOffer()
      const participant = await seedOfferParticipant(offer.id)
      const item = await seedOfferItem(offer.id)
      const link = await seedOfferItemParticipant(item.id, participant.id)
      expect(link.id).toMatch(/^ofip_/)
      expect(link.offerItemId).toBe(item.id)
      expect(link.participantId).toBe(participant.id)
      expect(link.role).toBe("traveler")
    })

    it("GET /offer-item-participants/:id → 200", async () => {
      const offer = await seedOffer()
      const participant = await seedOfferParticipant(offer.id)
      const item = await seedOfferItem(offer.id)
      const link = await seedOfferItemParticipant(item.id, participant.id)
      const res = await app.request(`/offer-item-participants/${link.id}`)
      expect(res.status).toBe(200)
    })

    it("GET /offer-item-participants/:id → 404 for missing", async () => {
      const res = await app.request("/offer-item-participants/ofip_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /offer-item-participants/:id → 200", async () => {
      const offer = await seedOffer()
      const participant = await seedOfferParticipant(offer.id)
      const item = await seedOfferItem(offer.id)
      const link = await seedOfferItemParticipant(item.id, participant.id)
      const res = await app.request(`/offer-item-participants/${link.id}`, {
        method: "PATCH",
        ...json({ role: "occupant", isPrimary: true }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.role).toBe("occupant")
      expect(body.data.isPrimary).toBe(true)
    })

    it("PATCH /offer-item-participants/:id → 404 for missing", async () => {
      const res = await app.request("/offer-item-participants/ofip_nonexistent", {
        method: "PATCH",
        ...json({ role: "occupant" }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /offer-item-participants/:id → 200", async () => {
      const offer = await seedOffer()
      const participant = await seedOfferParticipant(offer.id)
      const item = await seedOfferItem(offer.id)
      const link = await seedOfferItemParticipant(item.id, participant.id)
      const res = await app.request(`/offer-item-participants/${link.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /offer-item-participants/:id → 404 for missing", async () => {
      const res = await app.request("/offer-item-participants/ofip_nonexistent", {
        method: "DELETE",
      })
      expect(res.status).toBe(404)
    })

    it("GET /offer-item-participants → list by offerItemId", async () => {
      const offer = await seedOffer()
      const p1 = await seedOfferParticipant(offer.id)
      const p2 = await seedOfferParticipant(offer.id)
      const item = await seedOfferItem(offer.id)
      await seedOfferItemParticipant(item.id, p1.id)
      await seedOfferItemParticipant(item.id, p2.id)

      const res = await app.request(`/offer-item-participants?offerItemId=${item.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Orders
	   ═══════════════════════════════════════════════════════ */
  describe("Orders", () => {
    it("POST /orders → 201", async () => {
      const order = await seedOrder()
      expect(order.id).toMatch(/^ordr_/)
      expect(order.orderNumber).toMatch(/^ORD-\d{13}-0001$/)
      expect(order.title).toBe("Order 0001")
      expect(order.currency).toBe("USD")
      expect(order.status).toBe("draft")
    })

    it("GET /orders/:id → 200", async () => {
      const order = await seedOrder()
      const res = await app.request(`/orders/${order.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(order.id)
    })

    it("GET /orders/:id → 404 for missing", async () => {
      const res = await app.request("/orders/ordr_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /orders/:id → 200", async () => {
      const order = await seedOrder()
      const res = await app.request(`/orders/${order.id}`, {
        method: "PATCH",
        ...json({ title: "Updated Order", status: "confirmed", totalAmountCents: 75000 }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe("Updated Order")
      expect(body.data.status).toBe("confirmed")
      expect(body.data.totalAmountCents).toBe(75000)
    })

    it("PATCH /orders/:id → 404 for missing", async () => {
      const res = await app.request("/orders/ordr_nonexistent", {
        method: "PATCH",
        ...json({ title: "Nope" }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /orders/:id → 200", async () => {
      const order = await seedOrder()
      const res = await app.request(`/orders/${order.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
      const get = await app.request(`/orders/${order.id}`)
      expect(get.status).toBe(404)
    })

    it("DELETE /orders/:id → 404 for missing", async () => {
      const res = await app.request("/orders/ordr_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /orders → list with pagination", async () => {
      await seedOrder()
      await seedOrder()
      const res = await app.request("/orders?limit=1&offset=0")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(2)
    })

    it("GET /orders → filter by status", async () => {
      await seedOrder({ status: "draft" })
      await seedOrder({ status: "confirmed" })
      const res = await app.request("/orders?status=confirmed")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].status).toBe("confirmed")
    })

    it("GET /orders → search by title", async () => {
      await seedOrder({ title: "Summer Safari" })
      await seedOrder({ title: "Winter Trip" })
      const res = await app.request("/orders?search=Safari")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].title).toBe("Summer Safari")
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Order Participants
	   ═══════════════════════════════════════════════════════ */
  describe("Order Participants", () => {
    it("POST /order-participants → 201", async () => {
      const order = await seedOrder()
      const participant = await seedOrderParticipant(order.id)
      expect(participant.id).toMatch(/^orpt_/)
      expect(participant.orderId).toBe(order.id)
      expect(participant.participantType).toBe("traveler")
    })

    it("GET /order-participants/:id → 200", async () => {
      const order = await seedOrder()
      const participant = await seedOrderParticipant(order.id)
      const res = await app.request(`/order-participants/${participant.id}`)
      expect(res.status).toBe(200)
    })

    it("GET /order-participants/:id → 404 for missing", async () => {
      const res = await app.request("/order-participants/orpt_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /order-participants/:id → 200", async () => {
      const order = await seedOrder()
      const participant = await seedOrderParticipant(order.id)
      const res = await app.request(`/order-participants/${participant.id}`, {
        method: "PATCH",
        ...json({ isPrimary: true, travelerCategory: "child" }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.isPrimary).toBe(true)
      expect(body.data.travelerCategory).toBe("child")
    })

    it("PATCH /order-participants/:id → 404 for missing", async () => {
      const res = await app.request("/order-participants/orpt_nonexistent", {
        method: "PATCH",
        ...json({ isPrimary: true }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /order-participants/:id → 200", async () => {
      const order = await seedOrder()
      const participant = await seedOrderParticipant(order.id)
      const res = await app.request(`/order-participants/${participant.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /order-participants/:id → 404 for missing", async () => {
      const res = await app.request("/order-participants/orpt_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /order-participants → list by orderId", async () => {
      const o1 = await seedOrder()
      const o2 = await seedOrder()
      await seedOrderParticipant(o1.id)
      await seedOrderParticipant(o1.id)
      await seedOrderParticipant(o2.id)

      const res = await app.request(`/order-participants?orderId=${o1.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
      expect(body.total).toBe(2)
    })

    it("stores order participant travel identity encrypted and serves it through the dedicated route", async () => {
      const order = await seedOrder()
      const res = await app.request("/order-participants", {
        method: "POST",
        ...json({
          orderId: order.id,
          firstName: "Mihai",
          lastName: "Traveler",
          dateOfBirth: "1988-01-02",
          nationality: "RO",
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.hasTravelIdentity).toBe(true)
      expect(body.data).not.toHaveProperty("dateOfBirth")
      expect(body.data).not.toHaveProperty("nationality")

      const [stored] = await db
        .select()
        .from(orderParticipants)
        .where(eq(orderParticipants.id, body.data.id))

      expect(stored.identityEncrypted?.enc).toMatch(/^env:v1:/)

      const detailsRes = await app.request(`/order-participants/${body.data.id}/travel-details`)
      expect(detailsRes.status).toBe(200)
      const details = await detailsRes.json()
      expect(details.data.dateOfBirth).toBe("1988-01-02")
      expect(details.data.nationality).toBe("RO")
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Order Items
	   ═══════════════════════════════════════════════════════ */
  describe("Order Items", () => {
    it("POST /order-items → 201", async () => {
      const order = await seedOrder()
      const item = await seedOrderItem(order.id)
      expect(item.id).toMatch(/^orit_/)
      expect(item.orderId).toBe(order.id)
      expect(item.itemType).toBe("unit")
      expect(item.status).toBe("draft")
    })

    it("GET /order-items/:id → 200", async () => {
      const order = await seedOrder()
      const item = await seedOrderItem(order.id)
      const res = await app.request(`/order-items/${item.id}`)
      expect(res.status).toBe(200)
    })

    it("GET /order-items/:id → 404 for missing", async () => {
      const res = await app.request("/order-items/orit_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /order-items/:id → 200", async () => {
      const order = await seedOrder()
      const item = await seedOrderItem(order.id)
      const res = await app.request(`/order-items/${item.id}`, {
        method: "PATCH",
        ...json({ status: "confirmed", quantity: 2 }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.status).toBe("confirmed")
      expect(body.data.quantity).toBe(2)
    })

    it("PATCH /order-items/:id → 404 for missing", async () => {
      const res = await app.request("/order-items/orit_nonexistent", {
        method: "PATCH",
        ...json({ quantity: 5 }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /order-items/:id → 200", async () => {
      const order = await seedOrder()
      const item = await seedOrderItem(order.id)
      const res = await app.request(`/order-items/${item.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /order-items/:id → 404 for missing", async () => {
      const res = await app.request("/order-items/orit_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /order-items → list by orderId", async () => {
      const order = await seedOrder()
      await seedOrderItem(order.id)
      await seedOrderItem(order.id)

      const res = await app.request(`/order-items?orderId=${order.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
    })

    it("GET /order-items → filter by status", async () => {
      const order = await seedOrder()
      await seedOrderItem(order.id, { status: "draft" })
      await seedOrderItem(order.id, { status: "confirmed" })

      const res = await app.request("/order-items?status=confirmed")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].status).toBe("confirmed")
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Order Item Participants
	   ═══════════════════════════════════════════════════════ */
  describe("Order Item Participants", () => {
    it("POST /order-item-participants → 201", async () => {
      const order = await seedOrder()
      const participant = await seedOrderParticipant(order.id)
      const item = await seedOrderItem(order.id)
      const link = await seedOrderItemParticipant(item.id, participant.id)
      expect(link.id).toMatch(/^orip_/)
      expect(link.orderItemId).toBe(item.id)
      expect(link.participantId).toBe(participant.id)
      expect(link.role).toBe("traveler")
    })

    it("GET /order-item-participants/:id → 200", async () => {
      const order = await seedOrder()
      const participant = await seedOrderParticipant(order.id)
      const item = await seedOrderItem(order.id)
      const link = await seedOrderItemParticipant(item.id, participant.id)
      const res = await app.request(`/order-item-participants/${link.id}`)
      expect(res.status).toBe(200)
    })

    it("GET /order-item-participants/:id → 404 for missing", async () => {
      const res = await app.request("/order-item-participants/orip_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /order-item-participants/:id → 200", async () => {
      const order = await seedOrder()
      const participant = await seedOrderParticipant(order.id)
      const item = await seedOrderItem(order.id)
      const link = await seedOrderItemParticipant(item.id, participant.id)
      const res = await app.request(`/order-item-participants/${link.id}`, {
        method: "PATCH",
        ...json({ role: "beneficiary", isPrimary: true }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.role).toBe("beneficiary")
      expect(body.data.isPrimary).toBe(true)
    })

    it("PATCH /order-item-participants/:id → 404 for missing", async () => {
      const res = await app.request("/order-item-participants/orip_nonexistent", {
        method: "PATCH",
        ...json({ role: "occupant" }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /order-item-participants/:id → 200", async () => {
      const order = await seedOrder()
      const participant = await seedOrderParticipant(order.id)
      const item = await seedOrderItem(order.id)
      const link = await seedOrderItemParticipant(item.id, participant.id)
      const res = await app.request(`/order-item-participants/${link.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /order-item-participants/:id → 404 for missing", async () => {
      const res = await app.request("/order-item-participants/orip_nonexistent", {
        method: "DELETE",
      })
      expect(res.status).toBe(404)
    })

    it("GET /order-item-participants → list by orderItemId", async () => {
      const order = await seedOrder()
      const p1 = await seedOrderParticipant(order.id)
      const p2 = await seedOrderParticipant(order.id)
      const item = await seedOrderItem(order.id)
      await seedOrderItemParticipant(item.id, p1.id)
      await seedOrderItemParticipant(item.id, p2.id)

      const res = await app.request(`/order-item-participants?orderItemId=${item.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
    })
  })

  /* ═══════════════════════════════════════════════════════
	   Order Terms
	   ═══════════════════════════════════════════════════════ */
  describe("Order Terms", () => {
    it("POST /order-terms → 201 with orderId", async () => {
      const order = await seedOrder()
      const term = await seedOrderTerm({ orderId: order.id })
      expect(term.id).toMatch(/^ortm_/)
      expect(term.orderId).toBe(order.id)
      expect(term.termType).toBe("terms_and_conditions")
      expect(term.acceptanceStatus).toBe("pending")
      expect(term.required).toBe(true)
    })

    it("POST /order-terms → 201 with offerId", async () => {
      const offer = await seedOffer()
      const term = await seedOrderTerm({ offerId: offer.id })
      expect(term.offerId).toBe(offer.id)
    })

    it("GET /order-terms/:id → 200", async () => {
      const order = await seedOrder()
      const term = await seedOrderTerm({ orderId: order.id })
      const res = await app.request(`/order-terms/${term.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(term.id)
    })

    it("GET /order-terms/:id → 404 for missing", async () => {
      const res = await app.request("/order-terms/ortm_nonexistent")
      expect(res.status).toBe(404)
    })

    it("PATCH /order-terms/:id → 200", async () => {
      const order = await seedOrder()
      const term = await seedOrderTerm({ orderId: order.id })
      const res = await app.request(`/order-terms/${term.id}`, {
        method: "PATCH",
        ...json({
          termType: "cancellation",
          acceptanceStatus: "accepted",
          title: "Updated Term",
        }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.termType).toBe("cancellation")
      expect(body.data.acceptanceStatus).toBe("accepted")
      expect(body.data.title).toBe("Updated Term")
    })

    it("PATCH /order-terms/:id → 404 for missing", async () => {
      const res = await app.request("/order-terms/ortm_nonexistent", {
        method: "PATCH",
        ...json({ title: "Nope" }),
      })
      expect(res.status).toBe(404)
    })

    it("DELETE /order-terms/:id → 200", async () => {
      const order = await seedOrder()
      const term = await seedOrderTerm({ orderId: order.id })
      const res = await app.request(`/order-terms/${term.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)
    })

    it("DELETE /order-terms/:id → 404 for missing", async () => {
      const res = await app.request("/order-terms/ortm_nonexistent", { method: "DELETE" })
      expect(res.status).toBe(404)
    })

    it("GET /order-terms → list by orderId", async () => {
      const o1 = await seedOrder()
      const o2 = await seedOrder()
      await seedOrderTerm({ orderId: o1.id })
      await seedOrderTerm({ orderId: o1.id })
      await seedOrderTerm({ orderId: o2.id })

      const res = await app.request(`/order-terms?orderId=${o1.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
      expect(body.total).toBe(2)
    })

    it("GET /order-terms → filter by termType", async () => {
      const order = await seedOrder()
      await seedOrderTerm({ orderId: order.id }, { termType: "terms_and_conditions" })
      await seedOrderTerm({ orderId: order.id }, { termType: "cancellation" })

      const res = await app.request("/order-terms?termType=cancellation")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].termType).toBe("cancellation")
    })

    it("GET /order-terms → filter by acceptanceStatus", async () => {
      const order = await seedOrder()
      await seedOrderTerm({ orderId: order.id }, { acceptanceStatus: "pending" })
      await seedOrderTerm({ orderId: order.id }, { acceptanceStatus: "accepted" })

      const res = await app.request("/order-terms?acceptanceStatus=accepted")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].acceptanceStatus).toBe("accepted")
    })
  })
})
