import { describe, expect, it } from "vitest"

import {
  publicRepriceBookingSessionSchema,
  publicUpsertBookingSessionStateSchema,
} from "../../src/validation.js"

describe("Public booking session state schema", () => {
  it("parses wizard state updates with payload merge defaults", () => {
    const result = publicUpsertBookingSessionStateSchema.parse({
      currentStep: "rooms",
      payload: {
        selections: [{ itemId: "bki_123", optionUnitId: "optu_123" }],
      },
    })

    expect(result.currentStep).toBe("rooms")
    expect(result.replacePayload).toBe(false)
    expect(result.payload).toEqual({
      selections: [{ itemId: "bki_123", optionUnitId: "optu_123" }],
    })
  })
})

describe("Public booking session repricing schema", () => {
  it("parses repricing input with applyToSession defaulting to false", () => {
    const result = publicRepriceBookingSessionSchema.parse({
      selections: [{ itemId: "bki_123", optionUnitId: "optu_123" }],
    })

    expect(result.applyToSession).toBe(false)
    expect(result.selections[0]?.itemId).toBe("bki_123")
  })

  it("requires at least one repricing selection", () => {
    expect(() =>
      publicRepriceBookingSessionSchema.parse({
        selections: [],
      }),
    ).toThrow()
  })
})
