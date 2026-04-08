import { describe, expect, it } from "vitest"

import {
  octoAvailabilityCalendarQuerySchema,
  octoAvailabilityListQuerySchema,
  octoBookingListQuerySchema,
  octoProductListQuerySchema,
} from "../../src/validation.js"

describe("OCTO validation", () => {
  it("accepts valid product list query", () => {
    const result = octoProductListQuerySchema.parse({
      status: "active",
      bookingMode: "date_time",
      search: "boat",
    })

    expect(result.status).toBe("active")
    expect(result.bookingMode).toBe("date_time")
    expect(result.limit).toBe(50)
  })

  it("accepts valid booking list query", () => {
    const result = octoBookingListQuerySchema.parse({
      status: "on_hold",
      search: "BK-001",
    })

    expect(result.status).toBe("on_hold")
    expect(result.search).toBe("BK-001")
  })

  it("accepts valid availability list query", () => {
    const result = octoAvailabilityListQuerySchema.parse({
      productId: "prod_123",
      localDateStart: "2026-05-01",
      localDateEnd: "2026-05-31",
    })

    expect(result.limit).toBe(50)
    expect(result.offset).toBe(0)
    expect(result.productId).toBe("prod_123")
  })

  it("rejects inverted availability date ranges", () => {
    expect(() =>
      octoAvailabilityListQuerySchema.parse({
        localDateStart: "2026-06-10",
        localDateEnd: "2026-06-01",
      }),
    ).toThrow()
  })

  it("accepts valid calendar query", () => {
    const result = octoAvailabilityCalendarQuerySchema.parse({
      optionId: "opt_123",
      localDateStart: "2026-06-01",
      localDateEnd: "2026-06-30",
    })

    expect(result.optionId).toBe("opt_123")
  })
})
