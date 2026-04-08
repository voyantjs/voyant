import {
  applyDefaultBookingPaymentPlanSchema,
  createPaymentSessionFromInvoiceSchema,
  createPaymentSessionFromScheduleSchema,
} from "@voyantjs/finance"
import {
  sendInvoiceNotificationSchema,
  sendPaymentSessionNotificationSchema,
} from "@voyantjs/notifications"
import { z } from "zod"

export const checkoutCollectionMethodSchema = z.enum(["card", "bank_transfer"])
export const checkoutCollectionStageSchema = z.enum(["initial", "reminder", "manual"])
export const checkoutPaymentSessionTargetSchema = z.enum(["schedule", "invoice"])
export const checkoutInvoiceDocumentTypeSchema = z.enum(["proforma", "invoice"])

const planOverrideSchema = applyDefaultBookingPaymentPlanSchema.partial()

export const previewCheckoutCollectionSchema = z.object({
  method: checkoutCollectionMethodSchema,
  stage: checkoutCollectionStageSchema.default("initial"),
  scheduleId: z.string().optional(),
  invoiceId: z.string().optional(),
  ensureDefaultPaymentPlan: z.boolean().default(true),
  paymentSessionTarget: checkoutPaymentSessionTargetSchema.optional(),
  paymentPlan: planOverrideSchema.optional(),
})

export const initiateCheckoutCollectionSchema = previewCheckoutCollectionSchema.extend({
  paymentSession: z
    .union([createPaymentSessionFromScheduleSchema, createPaymentSessionFromInvoiceSchema])
    .optional(),
  paymentSessionNotification: sendPaymentSessionNotificationSchema.optional(),
  invoiceNotification: sendInvoiceNotificationSchema.optional(),
  notes: z.string().optional().nullable(),
})

export type PreviewCheckoutCollectionInput = z.infer<typeof previewCheckoutCollectionSchema>
export type InitiateCheckoutCollectionInput = z.infer<typeof initiateCheckoutCollectionSchema>
