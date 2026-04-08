import { describe, expect, it } from "vitest"

import {
  deriveOctoAvailabilityStatus,
  inferOctoAvailabilityType,
  inferOctoUnitType,
  mapBookingArtifact,
  mapBookingStatus,
} from "../../src/service.js"

describe("OCTO projection helpers", () => {
  it("maps open booking mode to opening hours", () => {
    expect(inferOctoAvailabilityType("open")).toBe("OPENING_HOURS")
  })

  it("maps non-open booking modes to start time", () => {
    expect(inferOctoAvailabilityType("date_time")).toBe("START_TIME")
    expect(inferOctoAvailabilityType("date")).toBe("START_TIME")
  })

  it("derives freesale status from free-sale products", () => {
    expect(
      deriveOctoAvailabilityStatus(
        {
          status: "open",
          unlimited: false,
          initialPax: 20,
          remainingPax: 20,
        },
        "free_sale",
      ),
    ).toBe("FREESALE")
  })

  it("derives limited when remaining capacity drops below half", () => {
    expect(
      deriveOctoAvailabilityStatus(
        {
          status: "open",
          unlimited: false,
          initialPax: 10,
          remainingPax: 4,
        },
        "limited",
      ),
    ).toBe("LIMITED")
  })

  it("derives sold out and closed states directly from slot status", () => {
    expect(
      deriveOctoAvailabilityStatus(
        {
          status: "sold_out",
          unlimited: false,
          initialPax: 10,
          remainingPax: 0,
        },
        "limited",
      ),
    ).toBe("SOLD_OUT")

    expect(
      deriveOctoAvailabilityStatus(
        {
          status: "closed",
          unlimited: false,
          initialPax: 10,
          remainingPax: 10,
        },
        "limited",
      ),
    ).toBe("CLOSED")
  })

  it("infers common OCTO unit taxonomies from Voyant naming", () => {
    expect(
      inferOctoUnitType({
        name: "Adult ticket",
        code: "adult",
        unitType: "person",
      }),
    ).toBe("ADULT")

    expect(
      inferOctoUnitType({
        name: "Child",
        code: null,
        unitType: "person",
      }),
    ).toBe("CHILD")

    expect(
      inferOctoUnitType({
        name: "Family package",
        code: "fam",
        unitType: "group",
      }),
    ).toBe("FAMILY")
  })

  it("maps booking status into OCTO reservation states", () => {
    expect(mapBookingStatus("on_hold")).toBe("ON_HOLD")
    expect(mapBookingStatus("confirmed")).toBe("CONFIRMED")
    expect(mapBookingStatus("completed")).toBe("CONFIRMED")
    expect(mapBookingStatus("expired")).toBe("EXPIRED")
    expect(mapBookingStatus("cancelled")).toBe("CANCELLED")
  })

  it("normalizes fulfillment payloads into booking artifacts", () => {
    const artifact = mapBookingArtifact({
      id: "bkfl_123",
      bookingId: "book_123",
      bookingItemId: "bkit_123",
      participantId: "bpar_123",
      fulfillmentType: "qr_code",
      deliveryChannel: "download",
      status: "issued",
      artifactUrl: "https://example.com/ticket.pdf",
      payload: {
        qrCode: "qr-value",
        voucherCode: "VCH-001",
      },
      issuedAt: new Date("2026-04-07T10:00:00Z"),
      revokedAt: null,
      createdAt: new Date("2026-04-07T10:00:00Z"),
      updatedAt: new Date("2026-04-07T10:00:00Z"),
    })

    expect(artifact.fulfillmentId).toBe("bkfl_123")
    expect(artifact.downloadUrl).toBe("https://example.com/ticket.pdf")
    expect(artifact.qrCode).toBe("qr-value")
    expect(artifact.voucherCode).toBe("VCH-001")
  })
})
