import { describe, expect, it } from "vitest"

import {
  confirmAndDispatchBookingResultSchema,
  confirmAndDispatchBookingSchema,
} from "../../src/validation.js"

describe("confirmAndDispatchBookingSchema", () => {
  it("defaults sendNotification to true so the happy path is one-shot", () => {
    const result = confirmAndDispatchBookingSchema.parse({})
    expect(result.sendNotification).toBe(true)
  })

  it("accepts preview-only mode", () => {
    const result = confirmAndDispatchBookingSchema.parse({ sendNotification: false })
    expect(result.sendNotification).toBe(false)
  })

  it("forwards the underlying send-documents fields", () => {
    const result = confirmAndDispatchBookingSchema.parse({
      templateSlug: "booking-confirmation",
      documentTypes: ["invoice", "contract"],
      subject: "Your booking is confirmed",
      to: "traveler@example.com",
    })
    expect(result.templateSlug).toBe("booking-confirmation")
    expect(result.documentTypes).toEqual(["invoice", "contract"])
    expect(result.subject).toBe("Your booking is confirmed")
  })
})

describe("confirmAndDispatchBookingResultSchema", () => {
  const documents = [
    {
      key: "inv_abc::pdf",
      source: "finance" as const,
      documentType: "invoice" as const,
      bookingId: "book_abc",
      invoiceId: "inv_abc",
      renditionId: "invr_abc",
      name: "invoice.pdf",
      createdAt: "2026-04-23T10:00:00.000Z",
    },
  ]

  it("parses a dispatched result", () => {
    const result = confirmAndDispatchBookingResultSchema.parse({
      bookingId: "book_abc",
      documents,
      notification: {
        recipient: "traveler@example.com",
        deliveryId: "ntdl_abc",
        provider: "resend",
        status: "sent",
      },
      skipReason: null,
    })
    expect(result.notification?.deliveryId).toBe("ntdl_abc")
    expect(result.skipReason).toBeNull()
  })

  it("parses a preview result (no notification, preview_only reason)", () => {
    const result = confirmAndDispatchBookingResultSchema.parse({
      bookingId: "book_abc",
      documents,
      notification: null,
      skipReason: "preview_only",
    })
    expect(result.notification).toBeNull()
    expect(result.skipReason).toBe("preview_only")
  })

  it("parses skip reasons surfaced from the send pipeline", () => {
    for (const reason of ["no_documents", "no_recipient", "no_attachments", "send_failed"]) {
      const result = confirmAndDispatchBookingResultSchema.parse({
        bookingId: "book_abc",
        documents,
        notification: null,
        skipReason: reason,
      })
      expect(result.skipReason).toBe(reason)
    }
  })

  it("rejects unknown skip reasons", () => {
    expect(() =>
      confirmAndDispatchBookingResultSchema.parse({
        bookingId: "book_abc",
        documents,
        notification: null,
        skipReason: "bogus",
      }),
    ).toThrow()
  })
})
