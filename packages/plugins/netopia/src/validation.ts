import {
  createPaymentSessionFromGuaranteeSchema,
  createPaymentSessionFromInvoiceSchema,
  createPaymentSessionFromScheduleSchema,
} from "@voyantjs/finance"
import {
  sendInvoiceNotificationSchema,
  sendPaymentSessionNotificationSchema,
} from "@voyantjs/notifications"
import { z } from "zod"

export const netopiaBillingAddressSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  city: z.string().min(1),
  country: z.number().int().positive(),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  details: z.string().min(1),
})

export const netopiaProductLineSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  vat: z.number().min(0).optional(),
})

export const netopiaInstallmentsSchema = z.object({
  selected: z.number().int().positive(),
  available: z.array(z.number().int().nonnegative()).min(1),
})

export const netopiaPaymentOptionsSchema = z.object({
  installments: z.number().int().positive(),
  bonus: z.number().int().nonnegative().optional(),
})

export const netopiaPaymentInstrumentSchema = z.object({
  type: z.string().min(1),
  account: z.string().min(1),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2000),
  secretCode: z.string().min(1),
  token: z.string().optional(),
})

export const netopiaBrowserDataSchema = z.record(z.string(), z.string().optional())

export const netopiaStartPaymentSessionSchema = z.object({
  description: z.string().optional(),
  notifyUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  callbackUrl: z.string().url().optional(),
  emailTemplate: z.string().optional(),
  language: z.string().optional(),
  options: netopiaPaymentOptionsSchema.optional(),
  instrument: netopiaPaymentInstrumentSchema.optional(),
  browserData: netopiaBrowserDataSchema.optional(),
  billing: netopiaBillingAddressSchema,
  shipping: netopiaBillingAddressSchema.optional(),
  products: z.array(netopiaProductLineSchema).optional(),
  installments: netopiaInstallmentsSchema.optional(),
  orderData: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().nullable().optional(),
})

export const netopiaWebhookPayloadSchema = z.object({
  order: z.object({
    orderID: z.string().min(1),
  }),
  payment: z
    .object({
      amount: z.number(),
      currency: z.string().min(3),
      ntpID: z.string().min(1),
      status: z.number().int(),
      code: z.string().optional(),
      message: z.string().optional(),
      data: z
        .object({
          AuthCode: z.string().optional(),
          RRN: z.string().optional(),
        })
        .catchall(z.unknown())
        .optional(),
      instrument: z
        .object({
          country: z.number().int().optional(),
          panMasked: z.string().optional(),
        })
        .catchall(z.unknown())
        .optional(),
    })
    .catchall(z.unknown()),
})

export const netopiaCollectBookingScheduleSchema = z.object({
  paymentSession: createPaymentSessionFromScheduleSchema.optional(),
  netopia: netopiaStartPaymentSessionSchema,
  notification: sendPaymentSessionNotificationSchema.optional(),
})

export const netopiaCollectBookingGuaranteeSchema = z.object({
  paymentSession: createPaymentSessionFromGuaranteeSchema.optional(),
  netopia: netopiaStartPaymentSessionSchema,
  notification: sendPaymentSessionNotificationSchema.optional(),
})

export const netopiaCollectInvoiceSchema = z.object({
  paymentSession: createPaymentSessionFromInvoiceSchema.optional(),
  netopia: netopiaStartPaymentSessionSchema,
  paymentSessionNotification: sendPaymentSessionNotificationSchema.optional(),
  invoiceNotification: sendInvoiceNotificationSchema.optional(),
})
