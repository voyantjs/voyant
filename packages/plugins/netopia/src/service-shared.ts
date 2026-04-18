import { financeService, type PaymentSession } from "@voyantjs/finance"
import { type NotificationDelivery, type NotificationService } from "@voyantjs/notifications"
import type { z } from "zod"

import { buildNetopiaNotificationRuntime } from "./notification-runtime.js"
import type {
  NetopiaProductLine,
  NetopiaRuntimeOptions,
  NetopiaStartPaymentResponse,
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

export type NetopiaCollectBookingScheduleInput = z.infer<typeof netopiaCollectBookingScheduleSchema>
export type NetopiaCollectBookingGuaranteeInput = z.infer<
  typeof netopiaCollectBookingGuaranteeSchema
>
export type NetopiaCollectInvoiceInput = z.infer<typeof netopiaCollectInvoiceSchema>

export function centsToAmount(cents: number) {
  return Number((cents / 100).toFixed(2))
}

export function amountToCents(amount: number) {
  return Math.round(amount * 100)
}

export function normalizeCurrency(currency: string) {
  return currency.trim().toUpperCase()
}

export function mergeRecord(
  base: Record<string, unknown> | null | undefined,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(base ?? {}),
    ...extra,
  }
}

export function buildDefaultProducts(
  session: PaymentSession,
  description: string,
): NetopiaProductLine[] {
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

export function resolveNotificationDispatcher(
  bindings: Record<string, unknown> | undefined,
  runtimeOptions: NetopiaRuntimeOptions,
  dispatcherOverride?: NotificationService,
) {
  return buildNetopiaNotificationRuntime(bindings, runtimeOptions, dispatcherOverride).dispatcher
}

export { financeService }
