import { Hono } from "hono"

import { type Env, notFound } from "./routes-shared.js"
import { publicFinanceService } from "./service-public.js"
import {
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
      publicValidateVoucherSchema.parse(await c.req.json()),
    )

    return c.json({ data: result })
  })
  .get("/bookings/:bookingId/documents", async (c) => {
    const documents = await publicFinanceService.getBookingDocuments(
      c.get("db"),
      c.req.param("bookingId"),
    )

    return documents ? c.json({ data: documents }) : notFound(c, "Booking documents not found")
  })
  .get("/bookings/:bookingId/payment-options", async (c) => {
    const options = await publicFinanceService.getBookingPaymentOptions(
      c.get("db"),
      c.req.param("bookingId"),
      publicPaymentOptionsQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams)),
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
        publicStartPaymentSessionSchema.parse(await c.req.json()),
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
        publicStartPaymentSessionSchema.parse(await c.req.json()),
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
        publicStartPaymentSessionSchema.parse(await c.req.json()),
      )

      return session ? c.json({ data: session }, 201) : notFound(c, "Invoice not found")
    } catch (error) {
      return c.json({ error: paymentConflictError(error) }, 409)
    }
  })

export type PublicFinanceRoutes = typeof publicFinanceRoutes
