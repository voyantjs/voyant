import { financeService, type PaymentSession } from "@voyantjs/finance"
import {
  createDefaultNotificationProviders,
  createNotificationService,
  notificationsService,
  type NotificationDelivery,
  type NotificationService,
} from "@voyantjs/notifications"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import { createNetopiaClient, resolveNetopiaRuntimeOptions, type NetopiaClientApi } from "./client.js"
import type {
  NetopiaRuntimeOptions,
  NetopiaStartPaymentInput,
  NetopiaStartPaymentRequest,
  NetopiaStartPaymentResponse,
  NetopiaWebhookPayload,
  NetopiaProductLine,
  ResolvedNetopiaRuntimeOptions,
} from "./types.js"
import type {
  netopiaCollectBookingGuaranteeSchema,
  netopiaCollectBookingScheduleSchema,
  netopiaCollectInvoiceSchema,
} from "./validation.js"

export interface NetopiaStartPaymentResult {
  session: PaymentSession
  providerResponse: NetopiaStartPaymentResponse
  orderId: string
}

export interface NetopiaCallbackResult {
  action: "processing" | "completed" | "failed" | "ignored"
  reason?: string
  session: PaymentSession | null
  orderId: string
}

export interface NetopiaCollectPaymentResult extends NetopiaStartPaymentResult {
  paymentSessionNotification: NotificationDelivery | null
  invoiceNotification: NotificationDelivery | null
}

type NetopiaCollectBookingScheduleInput = z.infer<typeof netopiaCollectBookingScheduleSchema>
type NetopiaCollectBookingGuaranteeInput = z.infer<typeof netopiaCollectBookingGuaranteeSchema>
type NetopiaCollectInvoiceInput = z.infer<typeof netopiaCollectInvoiceSchema>

function centsToAmount(cents: number) {
  return Number((cents / 100).toFixed(2))
}

function amountToCents(amount: number) {
  return Math.round(amount * 100)
}

function normalizeCurrency(currency: string) {
  return currency.trim().toUpperCase()
}

function mergeRecord(
  base: Record<string, unknown> | null | undefined,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(base ?? {}),
    ...extra,
  }
}

function buildDefaultProducts(session: PaymentSession, description: string): NetopiaProductLine[] {
  return [
    {
      name: description,
      price: centsToAmount(session.amountCents),
      vat: 0,
    },
  ]
}

export function deriveNetopiaOrderId(session: PaymentSession) {
  return session.externalReference ?? session.clientReference ?? session.id
}

export function mapNetopiaPaymentStatus(
  status: number,
  options: Pick<ResolvedNetopiaRuntimeOptions, "successStatuses" | "processingStatuses">,
): "completed" | "processing" | "failed" {
  if (options.successStatuses.includes(status)) return "completed"
  if (options.processingStatuses.includes(status)) return "processing"
  return "failed"
}

function resolveNotificationDispatcher(
  bindings: Record<string, unknown> | undefined,
  runtimeOptions: NetopiaRuntimeOptions,
  dispatcherOverride?: NotificationService,
) {
  if (dispatcherOverride) {
    return dispatcherOverride
  }

  return createNotificationService(
    runtimeOptions.resolveNotificationProviders?.(bindings ?? {}) ??
      createDefaultNotificationProviders(bindings ?? {}),
  )
}

export const netopiaService = {
  async startPaymentSession(
    db: PostgresJsDatabase,
    sessionId: string,
    input: NetopiaStartPaymentInput,
    runtimeOptions: NetopiaRuntimeOptions = {},
    clientOverride?: NetopiaClientApi,
    bindings?: Record<string, unknown>,
  ): Promise<NetopiaStartPaymentResult> {
    const session = await financeService.getPaymentSessionById(db, sessionId)
    if (!session) {
      throw new Error("Payment session not found")
    }

    if (session.provider && session.provider !== "netopia") {
      throw new Error(`Payment session ${sessionId} is already assigned to provider "${session.provider}"`)
    }

    if (["paid", "authorized", "cancelled", "expired"].includes(session.status)) {
      throw new Error(`Payment session ${sessionId} is not startable from status "${session.status}"`)
    }

    const runtime = resolveNetopiaRuntimeOptions(bindings, runtimeOptions)
    const client =
      clientOverride ??
      createNetopiaClient({
        apiUrl: runtime.apiUrl,
        apiKey: runtime.apiKey,
        fetch: runtime.fetch,
      })

    const description = input.description ?? session.notes ?? `Payment ${session.id}`
    const orderId = deriveNetopiaOrderId(session)
    const request: NetopiaStartPaymentRequest = {
      config: {
        emailTemplate: input.emailTemplate ?? runtime.emailTemplate,
        notifyUrl: input.notifyUrl ?? runtime.notifyUrl,
        redirectUrl: input.returnUrl ?? runtime.redirectUrl,
        language: input.language ?? runtime.language,
      },
      payment: {
        options: input.options ?? { installments: 1 },
        instrument: input.instrument,
        data: input.browserData,
      },
      order: {
        ntpID: "",
        posSignature: runtime.posSignature,
        dateTime: new Date().toISOString(),
        description,
        orderID: orderId,
        amount: centsToAmount(session.amountCents),
        currency: normalizeCurrency(session.currency),
        billing: input.billing,
        shipping: input.shipping ?? input.billing,
        products:
          input.products && input.products.length > 0
            ? input.products
            : buildDefaultProducts(session, description),
        installments: input.installments ?? { selected: 1, available: [0] },
        data: input.orderData,
      },
    }

    const providerResponse = await client.startCardPayment(request)
    const payment = providerResponse.payment
    if (!payment?.paymentURL) {
      throw new Error("Netopia start payment succeeded without paymentURL")
    }

    const updated = await financeService.markPaymentSessionRequiresRedirect(db, session.id, {
      provider: "netopia",
      providerSessionId: payment.ntpID ?? null,
      providerPaymentId: payment.ntpID ?? null,
      externalReference: orderId,
      redirectUrl: payment.paymentURL,
      returnUrl: input.returnUrl ?? runtime.redirectUrl,
      cancelUrl: input.cancelUrl ?? null,
      callbackUrl: input.callbackUrl ?? input.notifyUrl ?? runtime.notifyUrl,
      providerPayload: mergeRecord(session.providerPayload, {
        netopiaStartRequest: request,
        netopiaStartResponse: providerResponse,
      }),
      metadata: input.metadata ?? undefined,
      notes: input.notes ?? session.notes ?? undefined,
    })

    if (!updated) {
      throw new Error("Payment session disappeared while saving Netopia redirect state")
    }

    return {
      session: updated,
      providerResponse,
      orderId,
    }
  },

  async collectBookingSchedule(
    db: PostgresJsDatabase,
    scheduleId: string,
    input: NetopiaCollectBookingScheduleInput,
    runtimeOptions: NetopiaRuntimeOptions = {},
    clientOverride?: NetopiaClientApi,
    dispatcherOverride?: NotificationService,
    bindings?: Record<string, unknown>,
  ): Promise<NetopiaCollectPaymentResult> {
    const session = await financeService.createPaymentSessionFromBookingSchedule(db, scheduleId, {
      ...(input.paymentSession ?? {}),
      provider: "netopia",
    })

    if (!session) {
      throw new Error("Payment schedule not found")
    }

    const started = await this.startPaymentSession(
      db,
      session.id,
      input.netopia,
      runtimeOptions,
      clientOverride,
      bindings,
    )

    const dispatcher = input.notification
      ? resolveNotificationDispatcher(bindings, runtimeOptions, dispatcherOverride)
      : null

    const paymentSessionNotification =
      input.notification && dispatcher
        ? await notificationsService.sendPaymentSessionNotification(
            db,
            dispatcher,
            started.session.id,
            input.notification,
          )
        : null

    return {
      ...started,
      paymentSessionNotification,
      invoiceNotification: null,
    }
  },

  async collectBookingGuarantee(
    db: PostgresJsDatabase,
    guaranteeId: string,
    input: NetopiaCollectBookingGuaranteeInput,
    runtimeOptions: NetopiaRuntimeOptions = {},
    clientOverride?: NetopiaClientApi,
    dispatcherOverride?: NotificationService,
    bindings?: Record<string, unknown>,
  ): Promise<NetopiaCollectPaymentResult> {
    const session = await financeService.createPaymentSessionFromBookingGuarantee(db, guaranteeId, {
      ...(input.paymentSession ?? {}),
      provider: "netopia",
    })

    if (!session) {
      throw new Error("Booking guarantee not found")
    }

    const started = await this.startPaymentSession(
      db,
      session.id,
      input.netopia,
      runtimeOptions,
      clientOverride,
      bindings,
    )

    const dispatcher = input.notification
      ? resolveNotificationDispatcher(bindings, runtimeOptions, dispatcherOverride)
      : null

    const paymentSessionNotification =
      input.notification && dispatcher
        ? await notificationsService.sendPaymentSessionNotification(
            db,
            dispatcher,
            started.session.id,
            input.notification,
          )
        : null

    return {
      ...started,
      paymentSessionNotification,
      invoiceNotification: null,
    }
  },

  async collectInvoice(
    db: PostgresJsDatabase,
    invoiceId: string,
    input: NetopiaCollectInvoiceInput,
    runtimeOptions: NetopiaRuntimeOptions = {},
    clientOverride?: NetopiaClientApi,
    dispatcherOverride?: NotificationService,
    bindings?: Record<string, unknown>,
  ): Promise<NetopiaCollectPaymentResult> {
    const session = await financeService.createPaymentSessionFromInvoice(db, invoiceId, {
      ...(input.paymentSession ?? {}),
      provider: "netopia",
    })

    if (!session) {
      throw new Error("Invoice not found")
    }

    const started = await this.startPaymentSession(
      db,
      session.id,
      input.netopia,
      runtimeOptions,
      clientOverride,
      bindings,
    )

    const shouldNotify = Boolean(input.paymentSessionNotification || input.invoiceNotification)
    const dispatcher = shouldNotify
      ? resolveNotificationDispatcher(bindings, runtimeOptions, dispatcherOverride)
      : null

    const paymentSessionNotification =
      input.paymentSessionNotification && dispatcher
        ? await notificationsService.sendPaymentSessionNotification(
            db,
            dispatcher,
            started.session.id,
            input.paymentSessionNotification,
          )
        : null

    const invoiceNotification =
      input.invoiceNotification && dispatcher
        ? await notificationsService.sendInvoiceNotification(
            db,
            dispatcher,
            invoiceId,
            input.invoiceNotification,
          )
        : null

    return {
      ...started,
      paymentSessionNotification,
      invoiceNotification,
    }
  },

  async handleCallback(
    db: PostgresJsDatabase,
    payload: NetopiaWebhookPayload,
    runtimeOptions: NetopiaRuntimeOptions = {},
    bindings?: Record<string, unknown>,
  ): Promise<NetopiaCallbackResult> {
    const runtime = resolveNetopiaRuntimeOptions(bindings, runtimeOptions)
    const orderId = payload.order.orderID
    const lookup = await financeService.listPaymentSessions(db, {
      provider: "netopia",
      externalReference: orderId,
      limit: 1,
      offset: 0,
    })

    let session = lookup.data[0] ?? null
    if (!session) {
      session = await financeService.getPaymentSessionById(db, orderId)
    }

    if (!session) {
      return {
        action: "ignored",
        reason: "payment_session_not_found",
        session: null,
        orderId,
      }
    }

    const callbackState = mapNetopiaPaymentStatus(payload.payment.status, runtime)
    const providerPayload = mergeRecord(session.providerPayload, {
      netopiaCallback: payload,
    })
    const normalizedCurrency = normalizeCurrency(payload.payment.currency)
    const amountCents = amountToCents(payload.payment.amount)

    if (
      callbackState === "completed" &&
      (normalizedCurrency !== normalizeCurrency(session.currency) || amountCents !== session.amountCents)
    ) {
      const failed = await financeService.failPaymentSession(db, session.id, {
        providerSessionId: payload.payment.ntpID,
        providerPaymentId: payload.payment.ntpID,
        externalReference: orderId,
        failureCode: "amount_or_currency_mismatch",
        failureMessage: `Expected ${session.amountCents} ${normalizeCurrency(session.currency)}, received ${amountCents} ${normalizedCurrency}`,
        providerPayload,
      })

      return {
        action: "failed",
        reason: "amount_or_currency_mismatch",
        session: failed,
        orderId,
      }
    }

    if (callbackState === "processing") {
      const updated = await financeService.updatePaymentSession(db, session.id, {
        status: "processing",
        provider: "netopia",
        providerSessionId: payload.payment.ntpID,
        providerPaymentId: payload.payment.ntpID,
        externalReference: orderId,
        providerPayload,
      })

      return {
        action: "processing",
        session: updated,
        orderId,
      }
    }

    if (callbackState === "completed") {
      if (session.status === "paid" || session.status === "authorized") {
        const current = await financeService.updatePaymentSession(db, session.id, {
          provider: "netopia",
          providerSessionId: payload.payment.ntpID,
          providerPaymentId: payload.payment.ntpID,
          externalReference: orderId,
          providerPayload,
        })

        return {
          action: "ignored",
          reason: "already_completed",
          session: current,
          orderId,
        }
      }

      const completed = await financeService.completePaymentSession(db, session.id, {
        status: "paid",
        captureMode: "manual",
        paymentMethod: "credit_card",
        providerSessionId: payload.payment.ntpID,
        providerPaymentId: payload.payment.ntpID,
        externalReference: orderId,
        externalAuthorizationId:
          typeof payload.payment.data?.AuthCode === "string"
            ? payload.payment.data.AuthCode
            : payload.payment.ntpID,
        externalCaptureId:
          typeof payload.payment.data?.RRN === "string"
            ? payload.payment.data.RRN
            : payload.payment.ntpID,
        approvalCode:
          typeof payload.payment.data?.AuthCode === "string"
            ? payload.payment.data.AuthCode
            : undefined,
        referenceNumber:
          typeof payload.payment.data?.RRN === "string" ? payload.payment.data.RRN : undefined,
        authorizedAt: new Date().toISOString(),
        capturedAt: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        providerPayload,
      })

      return {
        action: "completed",
        session: completed,
        orderId,
      }
    }

    const failed = await financeService.failPaymentSession(db, session.id, {
      providerSessionId: payload.payment.ntpID,
      providerPaymentId: payload.payment.ntpID,
      externalReference: orderId,
      failureCode:
        typeof payload.payment.code === "string" && payload.payment.code.length > 0
          ? payload.payment.code
          : `netopia_status_${payload.payment.status}`,
      failureMessage:
        typeof payload.payment.message === "string" && payload.payment.message.length > 0
          ? payload.payment.message
          : "Netopia payment was not approved",
      providerPayload,
    })

    return {
      action: "failed",
      session: failed,
      orderId,
    }
  },
}
