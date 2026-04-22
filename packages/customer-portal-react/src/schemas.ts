import {
  bootstrapCustomerPortalResultSchema,
  bootstrapCustomerPortalSchema,
  createCustomerPortalCompanionSchema,
  customerPortalBookingBillingContactSchema,
  customerPortalBookingDetailSchema,
  customerPortalBookingDocumentSchema,
  customerPortalBookingSummarySchema,
  customerPortalCompanionSchema,
  customerPortalContactExistsResultSchema,
  customerPortalPhoneContactExistsResultSchema,
  customerPortalProfileSchema,
  importCustomerPortalBookingTravelersResultSchema,
  importCustomerPortalBookingTravelersSchema,
  updateCustomerPortalCompanionSchema,
  updateCustomerPortalProfileSchema,
} from "@voyantjs/customer-portal"
import { z } from "zod"

export const singleEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: item })
export const arrayEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: z.array(item) })
export const successEnvelope = z.object({ success: z.boolean() })

export const importCustomerPortalBookingParticipantsSchema =
  importCustomerPortalBookingTravelersSchema
export const importCustomerPortalBookingParticipantsResultSchema =
  importCustomerPortalBookingTravelersResultSchema

export {
  bootstrapCustomerPortalResultSchema,
  bootstrapCustomerPortalSchema,
  createCustomerPortalCompanionSchema,
  customerPortalBookingBillingContactSchema,
  customerPortalBookingDetailSchema,
  customerPortalBookingDocumentSchema,
  customerPortalBookingSummarySchema,
  customerPortalCompanionSchema,
  customerPortalContactExistsResultSchema,
  customerPortalPhoneContactExistsResultSchema,
  customerPortalProfileSchema,
  importCustomerPortalBookingTravelersResultSchema,
  importCustomerPortalBookingTravelersSchema,
  updateCustomerPortalCompanionSchema,
  updateCustomerPortalProfileSchema,
}

export const customerPortalProfileResponseSchema = singleEnvelope(customerPortalProfileSchema)
export const customerPortalBootstrapResponseSchema = singleEnvelope(
  bootstrapCustomerPortalResultSchema,
)
export const customerPortalCompanionsResponseSchema = arrayEnvelope(customerPortalCompanionSchema)
export const customerPortalCompanionResponseSchema = singleEnvelope(customerPortalCompanionSchema)
export const customerPortalCompanionImportResponseSchema = singleEnvelope(
  importCustomerPortalBookingTravelersResultSchema,
)
export const customerPortalBookingsResponseSchema = arrayEnvelope(
  customerPortalBookingSummarySchema,
)
export const customerPortalBookingResponseSchema = singleEnvelope(customerPortalBookingDetailSchema)
export const customerPortalBookingBillingContactResponseSchema = singleEnvelope(
  customerPortalBookingBillingContactSchema,
)
export const customerPortalBookingDocumentsResponseSchema = arrayEnvelope(
  customerPortalBookingDocumentSchema,
)
export const customerPortalContactExistsResponseSchema = singleEnvelope(
  customerPortalContactExistsResultSchema,
)
export const customerPortalPhoneContactExistsResponseSchema = singleEnvelope(
  customerPortalPhoneContactExistsResultSchema,
)

export type CustomerPortalProfileRecord = z.infer<typeof customerPortalProfileSchema>
export type BootstrapCustomerPortalInput = z.input<typeof bootstrapCustomerPortalSchema>
export type BootstrapCustomerPortalResult = z.infer<typeof bootstrapCustomerPortalResultSchema>
export type UpdateCustomerPortalProfileInput = z.input<typeof updateCustomerPortalProfileSchema>
export type CustomerPortalCompanionRecord = z.infer<typeof customerPortalCompanionSchema>
export type CreateCustomerPortalCompanionInput = z.input<typeof createCustomerPortalCompanionSchema>
export type UpdateCustomerPortalCompanionInput = z.input<typeof updateCustomerPortalCompanionSchema>
export type ImportCustomerPortalBookingTravelersInput = z.input<
  typeof importCustomerPortalBookingTravelersSchema
>
export type ImportCustomerPortalBookingTravelersResult = z.infer<
  typeof importCustomerPortalBookingTravelersResultSchema
>
export type ImportCustomerPortalBookingParticipantsInput = ImportCustomerPortalBookingTravelersInput
export type ImportCustomerPortalBookingParticipantsResult =
  ImportCustomerPortalBookingTravelersResult
export type CustomerPortalBookingSummaryRecord = z.infer<typeof customerPortalBookingSummarySchema>
export type CustomerPortalBookingRecord = z.infer<typeof customerPortalBookingDetailSchema>
export type CustomerPortalBookingBillingContactRecord = z.infer<
  typeof customerPortalBookingBillingContactSchema
>
export type CustomerPortalBookingDocumentRecord = z.infer<
  typeof customerPortalBookingDocumentSchema
>
export type CustomerPortalContactExistsRecord = z.infer<
  typeof customerPortalContactExistsResultSchema
>
export type CustomerPortalPhoneContactExistsRecord = z.infer<
  typeof customerPortalPhoneContactExistsResultSchema
>
