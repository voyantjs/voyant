import { describe, expect, it } from "vitest"

import { availabilityAggregatesQuerySchema } from "../../src/validation.js"

describe("availabilityAggregatesQuerySchema", () => {
  it("accepts an empty object", () => {
    const result = availabilityAggregatesQuerySchema.parse({})
    expect(result.from).toBeUndefined()
    expect(result.to).toBeUndefined()
  })

  it("accepts ISO datetime bounds", () => {
    const result = availabilityAggregatesQuerySchema.parse({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-04-01T00:00:00.000Z",
    })
    expect(result.from).toBe("2026-01-01T00:00:00.000Z")
  })

  it("rejects non-datetime strings", () => {
    expect(() => availabilityAggregatesQuerySchema.parse({ from: "yesterday" })).toThrow()
  })
})
