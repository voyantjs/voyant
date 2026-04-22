import {
  notificationChannelSchema,
  notificationDeliveryStatusSchema,
  notificationReminderRunRecordSchema,
  notificationReminderRunStatusSchema,
  notificationReminderStatusSchema,
  notificationReminderTargetTypeSchema,
  notificationTargetTypeSchema,
  previewNotificationTemplateResultSchema as notificationTemplatePreviewRecordSchema,
  notificationTemplateStatusSchema,
} from "@voyantjs/notifications"
import { z } from "zod"

export const paginatedEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })

export const singleEnvelope = <T extends z.ZodTypeAny>(item: T) => z.object({ data: item })
export const successEnvelope = z.object({ success: z.boolean() })

export const notificationTemplateRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  channel: notificationChannelSchema,
  provider: z.string().nullable(),
  status: notificationTemplateStatusSchema,
  subjectTemplate: z.string().nullable(),
  htmlTemplate: z.string().nullable(),
  textTemplate: z.string().nullable(),
  fromAddress: z.string().nullable(),
  isSystem: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type NotificationTemplateRecord = z.infer<typeof notificationTemplateRecordSchema>

export const notificationDeliveryRecordSchema = z.object({
  id: z.string(),
  templateId: z.string().nullable(),
  templateSlug: z.string().nullable(),
  targetType: notificationTargetTypeSchema,
  targetId: z.string().nullable(),
  personId: z.string().nullable(),
  organizationId: z.string().nullable(),
  bookingId: z.string().nullable(),
  invoiceId: z.string().nullable(),
  paymentSessionId: z.string().nullable(),
  channel: notificationChannelSchema,
  provider: z.string(),
  providerMessageId: z.string().nullable(),
  status: notificationDeliveryStatusSchema,
  toAddress: z.string(),
  fromAddress: z.string().nullable(),
  subject: z.string().nullable(),
  htmlBody: z.string().nullable(),
  textBody: z.string().nullable(),
  payloadData: z.record(z.string(), z.unknown()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  errorMessage: z.string().nullable(),
  scheduledFor: z.string().nullable(),
  sentAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type NotificationDeliveryRecord = z.infer<typeof notificationDeliveryRecordSchema>

export const notificationReminderRuleRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  status: notificationReminderStatusSchema,
  targetType: notificationReminderTargetTypeSchema,
  channel: notificationChannelSchema,
  provider: z.string().nullable(),
  templateId: z.string().nullable(),
  templateSlug: z.string().nullable(),
  relativeDaysFromDueDate: z.number().int(),
  isSystem: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type NotificationReminderRuleRecord = z.infer<typeof notificationReminderRuleRecordSchema>
export type NotificationReminderRunRecord = z.infer<typeof notificationReminderRunRecordSchema>
export type NotificationTemplatePreviewRecord = z.infer<
  typeof notificationTemplatePreviewRecordSchema
>

export const notificationTemplateListResponse = paginatedEnvelope(notificationTemplateRecordSchema)
export const notificationTemplateSingleResponse = singleEnvelope(notificationTemplateRecordSchema)
export const notificationDeliveryListResponse = paginatedEnvelope(notificationDeliveryRecordSchema)
export const notificationDeliverySingleResponse = singleEnvelope(notificationDeliveryRecordSchema)
export const notificationReminderRuleListResponse = paginatedEnvelope(
  notificationReminderRuleRecordSchema,
)
export const notificationReminderRuleSingleResponse = singleEnvelope(
  notificationReminderRuleRecordSchema,
)
export const notificationReminderRunListResponse = z.object({
  data: z.array(notificationReminderRunRecordSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
})
export const notificationReminderRunSingleResponse = singleEnvelope(
  notificationReminderRunRecordSchema,
)
export const notificationTemplatePreviewResponse = singleEnvelope(
  notificationTemplatePreviewRecordSchema,
)

export const notificationProviderOptionSchema = z.enum(["automatic", "resend", "twilio"])
export const notificationTemplateEditorChannelSchema = notificationChannelSchema
export const notificationReminderRuleStatusFilterSchema = notificationReminderStatusSchema
export const notificationReminderRunStatusFilterSchema = notificationReminderRunStatusSchema
