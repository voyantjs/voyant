import { describe, expect, it } from "vitest"
import {
  advanceClockTo,
  createClock,
  createRandom,
  createRandomUUID,
  hashSeed,
  now,
  seededRandom,
} from "../determinism.js"

describe("hashSeed", () => {
  it("is stable for the same input", () => {
    expect(hashSeed("run_abc")).toBe(hashSeed("run_abc"))
  })

  it("differs for different inputs", () => {
    expect(hashSeed("run_a")).not.toBe(hashSeed("run_b"))
  })
})

describe("seededRandom", () => {
  it("returns values in [0, 1)", () => {
    const r = seededRandom(1)
    for (let i = 0; i < 100; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it("produces the same sequence for the same seed", () => {
    const r1 = seededRandom(42)
    const r2 = seededRandom(42)
    for (let i = 0; i < 20; i++) {
      expect(r1()).toBe(r2())
    }
  })

  it("produces different sequences for different seeds", () => {
    const r1 = seededRandom(42)
    const r2 = seededRandom(43)
    // First 10 draws should not all collide.
    let collisions = 0
    for (let i = 0; i < 10; i++) {
      if (r1() === r2()) collisions += 1
    }
    expect(collisions).toBeLessThan(10)
  })
})

describe("createRandom", () => {
  it("is reproducible for the same run id", () => {
    const a = createRandom("run_xyz")
    const b = createRandom("run_xyz")
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b())
    }
  })
})

describe("createRandomUUID", () => {
  it("produces v4-shaped UUIDs", () => {
    const uuid = createRandomUUID(createRandom("run_u"))()
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it("is deterministic for the same run id", () => {
    const a = createRandomUUID(createRandom("run_det"))
    const b = createRandomUUID(createRandom("run_det"))
    expect(a()).toBe(b())
    expect(a()).toBe(b())
  })
})

describe("clock", () => {
  it("starts at baseWallClock with zero offset", () => {
    const clock = createClock(1_000_000)
    expect(now(clock)).toBe(1_000_000)
  })

  it("advances to the given event timestamp", () => {
    const clock = createClock(1_000_000)
    advanceClockTo(clock, 1_000_500)
    expect(now(clock)).toBe(1_000_500)
    advanceClockTo(clock, 2_000_000)
    expect(now(clock)).toBe(2_000_000)
  })
})
