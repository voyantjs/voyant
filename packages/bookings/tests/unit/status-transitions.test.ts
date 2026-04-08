import { describe, expect, it } from "vitest"

/**
 * Unit tests for booking status transitions and number generation.
 */

type BookingStatus =
  | "draft"
  | "on_hold"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled"

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["on_hold", "confirmed", "cancelled"],
  on_hold: ["confirmed", "expired", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  expired: [],
  cancelled: [],
}

function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

function generateBookingNumber(prefix: string, sequence: number): string {
  const padded = String(sequence).padStart(6, "0")
  return `${prefix}-${padded}`
}

describe("Booking status transitions", () => {
  describe("valid transitions", () => {
    it("allows draft → on_hold", () => {
      expect(isValidTransition("draft", "on_hold")).toBe(true)
    })

    it("allows draft → confirmed", () => {
      expect(isValidTransition("draft", "confirmed")).toBe(true)
    })

    it("allows draft → cancelled", () => {
      expect(isValidTransition("draft", "cancelled")).toBe(true)
    })

    it("allows on_hold → confirmed", () => {
      expect(isValidTransition("on_hold", "confirmed")).toBe(true)
    })

    it("allows on_hold → expired", () => {
      expect(isValidTransition("on_hold", "expired")).toBe(true)
    })

    it("allows on_hold → cancelled", () => {
      expect(isValidTransition("on_hold", "cancelled")).toBe(true)
    })

    it("allows confirmed → in_progress", () => {
      expect(isValidTransition("confirmed", "in_progress")).toBe(true)
    })

    it("allows confirmed → cancelled", () => {
      expect(isValidTransition("confirmed", "cancelled")).toBe(true)
    })

    it("allows in_progress → completed", () => {
      expect(isValidTransition("in_progress", "completed")).toBe(true)
    })

    it("allows in_progress → cancelled", () => {
      expect(isValidTransition("in_progress", "cancelled")).toBe(true)
    })
  })

  describe("invalid transitions", () => {
    it("rejects draft → in_progress (must go through confirmed)", () => {
      expect(isValidTransition("draft", "in_progress")).toBe(false)
    })

    it("rejects on_hold → completed", () => {
      expect(isValidTransition("on_hold", "completed")).toBe(false)
    })

    it("rejects draft → completed", () => {
      expect(isValidTransition("draft", "completed")).toBe(false)
    })

    it("rejects confirmed → completed (must go through in_progress)", () => {
      expect(isValidTransition("confirmed", "completed")).toBe(false)
    })

    it("rejects completed → any", () => {
      expect(isValidTransition("completed", "draft")).toBe(false)
      expect(isValidTransition("completed", "confirmed")).toBe(false)
      expect(isValidTransition("completed", "cancelled")).toBe(false)
    })

    it("rejects cancelled → any", () => {
      expect(isValidTransition("cancelled", "draft")).toBe(false)
      expect(isValidTransition("cancelled", "confirmed")).toBe(false)
    })

    it("rejects expired → any", () => {
      expect(isValidTransition("expired", "draft")).toBe(false)
      expect(isValidTransition("expired", "confirmed")).toBe(false)
    })
  })
})

describe("Booking number generation", () => {
  it("generates padded number with prefix", () => {
    expect(generateBookingNumber("BK", 1)).toBe("BK-000001")
  })

  it("pads to 6 digits", () => {
    expect(generateBookingNumber("BK", 42)).toBe("BK-000042")
  })

  it("handles large numbers", () => {
    expect(generateBookingNumber("BK", 999999)).toBe("BK-999999")
  })

  it("allows custom prefix", () => {
    expect(generateBookingNumber("DMC", 123)).toBe("DMC-000123")
  })
})
