import { describe, expect, it } from "vitest"

import type { ExternalCruise } from "../../src/adapters/index.js"
import { memoizeCruiseAdapter } from "../../src/adapters/memoize.js"
import { MockCruiseAdapter } from "../../src/adapters/mock.js"

const cruise: ExternalCruise = {
  sourceRef: { externalId: "ext-1" },
  name: "Test Cruise",
  slug: "test-cruise",
  cruiseType: "ocean",
  lineName: "Acme",
  nights: 7,
}

describe("memoizeCruiseAdapter — caching behavior", () => {
  it("caches fetchCruise within the TTL window", async () => {
    const inner = new MockCruiseAdapter()
    inner.addCruise(cruise)
    const cached = memoizeCruiseAdapter(inner, { ttlMs: 60_000 })

    await cached.fetchCruise(cruise.sourceRef)
    await cached.fetchCruise(cruise.sourceRef)
    await cached.fetchCruise(cruise.sourceRef)

    // The mock counts every call to its underlying methods.
    expect(inner.callCount).toBe(1)
  })

  it("re-fetches after TTL expires", async () => {
    const inner = new MockCruiseAdapter()
    inner.addCruise(cruise)
    const cached = memoizeCruiseAdapter(inner, { ttlMs: 1 }) // expires immediately

    await cached.fetchCruise(cruise.sourceRef)
    // Wait past the TTL
    await new Promise((r) => setTimeout(r, 5))
    await cached.fetchCruise(cruise.sourceRef)

    expect(inner.callCount).toBe(2)
  })

  it("does not cache listEntries (always live)", async () => {
    const inner = new MockCruiseAdapter()
    inner.addCruise(cruise)
    const cached = memoizeCruiseAdapter(inner, { ttlMs: 60_000 })

    await cached.listEntries()
    await cached.listEntries()
    await cached.listEntries()

    expect(inner.callCount).toBe(3)
  })

  it("does not cache createBooking (always live)", async () => {
    const inner = new MockCruiseAdapter()
    const cached = memoizeCruiseAdapter(inner, { ttlMs: 60_000 })
    const input = {
      sailingRef: { externalId: "s1" },
      cabinCategoryRef: { externalId: "c1" },
      occupancy: 2,
      passengers: [{ firstName: "A", lastName: "B" }],
      contact: { firstName: "A", lastName: "B" },
    }

    await cached.createBooking(input)
    await cached.createBooking(input)

    expect(inner.callCount).toBe(2)
  })

  it("treats different sourceRefs as separate cache entries", async () => {
    const inner = new MockCruiseAdapter()
    inner.addCruise(cruise)
    inner.addCruise({ ...cruise, sourceRef: { externalId: "ext-2" }, slug: "other" })
    const cached = memoizeCruiseAdapter(inner, { ttlMs: 60_000 })

    await cached.fetchCruise({ externalId: "ext-1" })
    await cached.fetchCruise({ externalId: "ext-2" })
    await cached.fetchCruise({ externalId: "ext-1" }) // cache hit
    await cached.fetchCruise({ externalId: "ext-2" }) // cache hit

    expect(inner.callCount).toBe(2)
  })

  it("preserves connectionId in the cache key", async () => {
    const inner = new MockCruiseAdapter()
    inner.addCruise({ ...cruise, sourceRef: { externalId: "ext-1", connectionId: "conn-A" } })
    inner.addCruise({
      ...cruise,
      sourceRef: { externalId: "ext-1", connectionId: "conn-B" },
      slug: "other",
    })
    const cached = memoizeCruiseAdapter(inner, { ttlMs: 60_000 })

    const a = await cached.fetchCruise({ externalId: "ext-1", connectionId: "conn-A" })
    const b = await cached.fetchCruise({ externalId: "ext-1", connectionId: "conn-B" })

    expect(a?.slug).toBe("test-cruise")
    expect(b?.slug).toBe("other")
    expect(inner.callCount).toBe(2)
  })
})
