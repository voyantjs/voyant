import {
  bootstrapCustomerPortalResultSchema,
  bootstrapCustomerPortalSchema,
  createCustomerPortalCompanionSchema,
  customerPortalBookingDetailSchema,
  customerPortalBookingDocumentSchema,
  customerPortalBookingSummarySchema,
  customerPortalCompanionSchema,
  customerPortalContactExistsResultSchema,
  customerPortalProfileSchema,
  updateCustomerPortalCompanionSchema,
  updateCustomerPortalProfileSchema,
} from "@voyantjs/customer-portal"
import { z } from "zod"

export const singleEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: item })
export const arrayEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: z.array(item) })
export const successEnvelope = z.object({ success: z.boolean() })

export {
  bootstrapCustomerPortalResultSchema,
  bootstrapCustomerPortalSchema,
  createCustomerPortalCompanionSchema,
  customerPortalBookingDetailSchema,
  customerPortalBookingDocumentSchema,
  customerPortalBookingSummarySchema,
  customerPortalCompanionSchema,
  customerPortalContactExistsResultSchema,
  customerPortalProfileSchema,
  updateCustomerPortalCompanionSchema,
  updateCustomerPortalProfileSchema,
}

export const customerPortalProfileResponseSchema = singleEnvelope(customerPortalProfileSchema)
export const customerPortalBootstrapResponseSchema = singleEnvelope(
  bootstrapCustomerPortalResultSchema,
)
export const customerPortalCompanionsResponseSchema = arrayEnvelope(customerPortalCompanionSchema)
export const customerPortalCompanionResponseSchema = singleEnvelope(customerPortalCompanionSchema)
export const customerPortalBookingsResponseSchema = arrayEnvelope(
  customerPortalBookingSummarySchema,
)
export const customerPortalBookingResponseSchema = singleEnvelope(customerPortalBookingDetailSchema)
export const customerPortalBookingDocumentsResponseSchema = arrayEnvelope(
  customerPortalBookingDocumentSchema,
)
export const customerPortalContactExistsResponseSchema = singleEnvelope(
  customerPortalContactExistsResultSchema,
)

export type CustomerPortalProfileRecord = z.infer<typeof customerPortalProfileSchema>
export type BootstrapCustomerPortalInput = z.input<typeof bootstrapCustomerPortalSchema>
export type BootstrapCustomerPortalResult = z.infer<typeof bootstrapCustomerPortalResultSchema>
export type UpdateCustomerPortalProfileInput = z.input<typeof updateCustomerPortalProfileSchema>
export type CustomerPortalCompanionRecord = z.infer<typeof customerPortalCompanionSchema>
export type CreateCustomerPortalCompanionInput = z.input<typeof createCustomerPortalCompanionSchema>
export type UpdateCustomerPortalCompanionInput = z.input<typeof updateCustomerPortalCompanionSchema>
export type CustomerPortalBookingSummaryRecord = z.infer<typeof customerPortalBookingSummarySchema>
export type CustomerPortalBookingRecord = z.infer<typeof customerPortalBookingDetailSchema>
export type CustomerPortalBookingDocumentRecord = z.infer<
  typeof customerPortalBookingDocumentSchema
>
export type CustomerPortalContactExistsRecord = z.infer<
  typeof customerPortalContactExistsResultSchema
>
