import { describe, expect, it } from "vitest"

import { financeAggregatesQuerySchema } from "../../src/validation-shared.js"

describe("financeAggregatesQuerySchema", () => {
  it("accepts an empty object", () => {
    const result = financeAggregatesQuerySchema.parse({})
    expect(result.from).toBeUndefined()
    expect(result.to).toBeUndefined()
  })

  it("accepts ISO datetime bounds", () => {
    const result = financeAggregatesQuerySchema.parse({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-04-01T00:00:00.000Z",
    })
    expect(result.from).toBe("2026-01-01T00:00:00.000Z")
    expect(result.to).toBe("2026-04-01T00:00:00.000Z")
  })

  it("rejects non-datetime strings", () => {
    expect(() => financeAggregatesQuerySchema.parse({ from: "yesterday" })).toThrow()
    expect(() => financeAggregatesQuerySchema.parse({ from: "2026-01-01" })).toThrow()
  })
})
