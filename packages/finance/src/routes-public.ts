import { parseJsonBody, parseQuery } from "@voyantjs/hono"
import { Hono } from "hono"

import { type Env, notFound } from "./routes-shared.js"
import { publicFinanceService } from "./service-public.js"
import {
  publicFinanceDocumentLookupQuerySchema,
  publicPaymentOptionsQuerySchema,
  publicStartPaymentSessionSchema,
  publicValidateVoucherSchema,
} from "./validation-public.js"

function paymentConflictError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Unable to start payment session"
}

export const publicFinanceRoutes = new Hono<Env>()
  .post("/vouchers/validate", async (c) => {
    const result = await publicFinanceService.validateVoucher(
      c.get("db"),
      await parseJsonBody(c, publicValidateVoucherSchema),
    )

    return c.json({ data: result })
  })
  .get("/documents/by-reference", async (c) => {
    const document = await publicFinanceService.getDocumentByReference(
      c.get("db"),
      parseQuery(c, publicFinanceDocumentLookupQuerySchema).reference,
    )

    return document ? c.json({ data: document }) : notFound(c, "Finance document not found")
  })
  .get("/bookings/:bookingId/documents", async (c) => {
    const documents = await publicFinanceService.getBookingDocuments(
      c.get("db"),
      c.req.param("bookingId"),
    )

    return documents ? c.json({ data: documents }) : notFound(c, "Booking documents not found")
  })
  .get("/bookings/:bookingId/payments", async (c) => {
    const payments = await publicFinanceService.getBookingPayments(
      c.get("db"),
      c.req.param("bookingId"),
    )

    return payments ? c.json({ data: payments }) : notFound(c, "Booking payments not found")
  })
  .get("/bookings/:bookingId/payment-options", async (c) => {
    const options = await publicFinanceService.getBookingPaymentOptions(
      c.get("db"),
      c.req.param("bookingId"),
      parseQuery(c, publicPaymentOptionsQuerySchema),
    )

    return options ? c.json({ data: options }) : notFound(c, "Booking payment options not found")
  })
  .get("/payment-sessions/:sessionId", async (c) => {
    const session = await publicFinanceService.getPaymentSession(
      c.get("db"),
      c.req.param("sessionId"),
    )

    return session ? c.json({ data: session }) : notFound(c, "Payment session not found")
  })
  .post("/bookings/:bookingId/payment-schedules/:scheduleId/payment-session", async (c) => {
    try {
      const session = await publicFinanceService.startBookingSchedulePaymentSession(
        c.get("db"),
        c.req.param("bookingId"),
        c.req.param("scheduleId"),
        await parseJsonBody(c, publicStartPaymentSessionSchema),
      )

      return session
        ? c.json({ data: session }, 201)
        : notFound(c, "Booking payment schedule not found")
    } catch (error) {
      return c.json({ error: paymentConflictError(error) }, 409)
    }
  })
  .post("/bookings/:bookingId/guarantees/:guaranteeId/payment-session", async (c) => {
    try {
      const session = await publicFinanceService.startBookingGuaranteePaymentSession(
        c.get("db"),
        c.req.param("bookingId"),
        c.req.param("guaranteeId"),
        await parseJsonBody(c, publicStartPaymentSessionSchema),
      )

      return session ? c.json({ data: session }, 201) : notFound(c, "Booking guarantee not found")
    } catch (error) {
      return c.json({ error: paymentConflictError(error) }, 409)
    }
  })
  .post("/invoices/:invoiceId/payment-session", async (c) => {
    try {
      const session = await publicFinanceService.startInvoicePaymentSession(
        c.get("db"),
        c.req.param("invoiceId"),
        await parseJsonBody(c, publicStartPaymentSessionSchema),
      )

      return session ? c.json({ data: session }, 201) : notFound(c, "Invoice not found")
    } catch (error) {
      return c.json({ error: paymentConflictError(error) }, 409)
    }
  })

export type PublicFinanceRoutes = typeof publicFinanceRoutes
