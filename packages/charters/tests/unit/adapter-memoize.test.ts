import { describe, expect, it } from "vitest"

import type { ExternalCharterProduct, ExternalCharterVoyage } from "../../src/adapters/index.js"
import { memoizeCharterAdapter } from "../../src/adapters/memoize.js"
import { MockCharterAdapter } from "../../src/adapters/mock.js"

const product: ExternalCharterProduct = {
  sourceRef: { externalId: "ext-prod-1" },
  name: "P",
  slug: "p",
  lineName: "Line",
}
const voyage: ExternalCharterVoyage = {
  sourceRef: { externalId: "ext-voy-1" },
  productRef: product.sourceRef,
  yachtRef: { externalId: "ext-yacht-1" },
  voyageCode: "V1",
  departureDate: "2026-04-12",
  returnDate: "2026-04-19",
  nights: 7,
  bookingModes: ["per_suite"],
}

function seed() {
  const adapter = new MockCharterAdapter()
  adapter.addProduct(product, [voyage])
  adapter.setVoyageSuites(voyage.sourceRef, [])
  adapter.setVoyageSchedule(voyage.sourceRef, [])
  return adapter
}

describe("memoizeCharterAdapter", () => {
  it("caches fetchProduct within the TTL window", async () => {
    const inner = seed()
    const wrapped = memoizeCharterAdapter(inner, { ttlMs: 60_000 })
    await wrapped.fetchProduct(product.sourceRef)
    await wrapped.fetchProduct(product.sourceRef)
    await wrapped.fetchProduct(product.sourceRef)
    expect(inner.callCount).toBe(1)
  })

  it("does NOT cache listEntries — always goes live", async () => {
    const inner = seed()
    const wrapped = memoizeCharterAdapter(inner, { ttlMs: 60_000 })
    await wrapped.listEntries()
    await wrapped.listEntries()
    expect(inner.callCount).toBe(2)
  })

  it("does NOT cache createPerSuiteBooking", async () => {
    const inner = seed()
    const wrapped = memoizeCharterAdapter(inner, { ttlMs: 60_000 })
    await wrapped.createPerSuiteBooking({
      voyageRef: voyage.sourceRef,
      suiteRef: { externalId: "x" },
      currency: "USD",
      guests: [{ firstName: "g", lastName: "l" }],
      contact: { firstName: "g", lastName: "l" },
    })
    await wrapped.createPerSuiteBooking({
      voyageRef: voyage.sourceRef,
      suiteRef: { externalId: "x" },
      currency: "USD",
      guests: [{ firstName: "g", lastName: "l" }],
      contact: { firstName: "g", lastName: "l" },
    })
    expect(inner.perSuiteBookingCount).toBe(2)
  })

  it("expires entries after TTL", async () => {
    const inner = seed()
    const wrapped = memoizeCharterAdapter(inner, { ttlMs: 1 })
    await wrapped.fetchProduct(product.sourceRef)
    await new Promise((resolve) => setTimeout(resolve, 10))
    await wrapped.fetchProduct(product.sourceRef)
    expect(inner.callCount).toBe(2)
  })

  it("uses different cache slots for fetchProduct vs fetchVoyage", async () => {
    const inner = seed()
    const wrapped = memoizeCharterAdapter(inner)
    await wrapped.fetchProduct(product.sourceRef)
    await wrapped.fetchVoyage(voyage.sourceRef)
    // Two distinct upstream calls (no shared cache).
    expect(inner.callCount).toBe(2)
    // Hit each again; should be served from cache.
    await wrapped.fetchProduct(product.sourceRef)
    await wrapped.fetchVoyage(voyage.sourceRef)
    expect(inner.callCount).toBe(2)
  })
})
