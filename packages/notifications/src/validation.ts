import { z } from "zod"

export const notificationChannelSchema = z.enum(["email", "sms"])
export const notificationTemplateStatusSchema = z.enum(["draft", "active", "archived"])
export const notificationDeliveryStatusSchema = z.enum(["pending", "sent", "failed", "cancelled"])
export const notificationTargetTypeSchema = z.enum([
  "booking",
  "booking_payment_schedule",
  "booking_guarantee",
  "invoice",
  "payment_session",
  "person",
  "organization",
  "other",
])
export const notificationReminderStatusSchema = z.enum(["draft", "active", "archived"])
export const notificationReminderTargetTypeSchema = z.enum(["booking_payment_schedule"])
export const notificationReminderRunStatusSchema = z.enum([
  "processing",
  "sent",
  "skipped",
  "failed",
])

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

const notificationTemplateCoreSchema = z.object({
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  channel: notificationChannelSchema,
  provider: z.string().max(255).optional().nullable(),
  status: notificationTemplateStatusSchema.default("draft"),
  subjectTemplate: z.string().max(2000).optional().nullable(),
  htmlTemplate: z.string().optional().nullable(),
  textTemplate: z.string().optional().nullable(),
  fromAddress: z.string().max(500).optional().nullable(),
  isSystem: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const insertNotificationTemplateSchema = notificationTemplateCoreSchema
export const updateNotificationTemplateSchema = notificationTemplateCoreSchema.partial()

export const notificationTemplateListQuerySchema = paginationSchema.extend({
  channel: notificationChannelSchema.optional(),
  provider: z.string().optional(),
  status: notificationTemplateStatusSchema.optional(),
  search: z.string().optional(),
})

export const notificationDeliveryListQuerySchema = paginationSchema.extend({
  channel: notificationChannelSchema.optional(),
  provider: z.string().optional(),
  status: notificationDeliveryStatusSchema.optional(),
  templateSlug: z.string().optional(),
  targetType: notificationTargetTypeSchema.optional(),
  targetId: z.string().optional(),
  bookingId: z.string().optional(),
  invoiceId: z.string().optional(),
  paymentSessionId: z.string().optional(),
  personId: z.string().optional(),
  organizationId: z.string().optional(),
})

const notificationReminderRuleCoreSchema = z.object({
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  status: notificationReminderStatusSchema.default("draft"),
  targetType: notificationReminderTargetTypeSchema,
  channel: notificationChannelSchema,
  provider: z.string().max(255).optional().nullable(),
  templateId: z.string().optional().nullable(),
  templateSlug: z.string().max(255).optional().nullable(),
  relativeDaysFromDueDate: z.coerce.number().int().min(-365).max(365).default(0),
  isSystem: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const insertNotificationReminderRuleSchema = notificationReminderRuleCoreSchema.refine(
  (value) => Boolean(value.templateId || value.templateSlug),
  {
    message: "templateId or templateSlug is required",
    path: ["templateId"],
  },
)

export const updateNotificationReminderRuleSchema = notificationReminderRuleCoreSchema
  .partial()
  .refine((value) => value.templateId !== "" && value.templateSlug !== "", {
    message: "templateId and templateSlug cannot be empty strings",
  })

export const notificationReminderRuleListQuerySchema = paginationSchema.extend({
  status: notificationReminderStatusSchema.optional(),
  targetType: notificationReminderTargetTypeSchema.optional(),
  channel: notificationChannelSchema.optional(),
  search: z.string().optional(),
})

export const notificationReminderRunListQuerySchema = paginationSchema.extend({
  reminderRuleId: z.string().optional(),
  targetType: notificationReminderTargetTypeSchema.optional(),
  targetId: z.string().optional(),
  bookingId: z.string().optional(),
  status: notificationReminderRunStatusSchema.optional(),
})

export const runDueRemindersSchema = z.object({
  now: z.string().datetime().optional().nullable(),
})

const transportNotificationCoreSchema = z.object({
  templateId: z.string().optional().nullable(),
  templateSlug: z.string().optional().nullable(),
  channel: notificationChannelSchema.default("email"),
  provider: z.string().optional().nullable(),
  to: z.string().min(1).optional().nullable(),
  from: z.string().max(500).optional().nullable(),
  subject: z.string().max(2000).optional().nullable(),
  html: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
  data: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  scheduledFor: z.string().optional().nullable(),
})

export const sendPaymentSessionNotificationSchema = transportNotificationCoreSchema.refine(
  (value) =>
    Boolean(value.templateId || value.templateSlug || value.subject || value.html || value.text),
  {
    message: "templateId, templateSlug, or direct content is required",
  },
)

export const sendInvoiceNotificationSchema = transportNotificationCoreSchema.refine(
  (value) =>
    Boolean(value.templateId || value.templateSlug || value.subject || value.html || value.text),
  {
    message: "templateId, templateSlug, or direct content is required",
  },
)

export const sendNotificationSchema = z
  .object({
    templateId: z.string().optional().nullable(),
    templateSlug: z.string().optional().nullable(),
    channel: notificationChannelSchema.optional(),
    provider: z.string().optional().nullable(),
    to: z.string().min(1),
    from: z.string().max(500).optional().nullable(),
    subject: z.string().max(2000).optional().nullable(),
    html: z.string().optional().nullable(),
    text: z.string().optional().nullable(),
    data: z.record(z.string(), z.unknown()).optional().nullable(),
    targetType: notificationTargetTypeSchema.default("other"),
    targetId: z.string().optional().nullable(),
    bookingId: z.string().optional().nullable(),
    invoiceId: z.string().optional().nullable(),
    paymentSessionId: z.string().optional().nullable(),
    personId: z.string().optional().nullable(),
    organizationId: z.string().optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
    scheduledFor: z.string().optional().nullable(),
  })
  .refine(
    (value) =>
      Boolean(value.templateId || value.templateSlug || value.subject || value.html || value.text),
    {
      message: "templateId, templateSlug, or direct content is required",
    },
  )
