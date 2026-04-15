import type { HonoModule } from "@voyantjs/hono/module"

import { createNotificationsRoutes } from "./routes.js"
import { notificationsModule } from "./schema.js"

export type { DefaultNotificationProviderOptions } from "./provider-resolution.js"
export {
  createDefaultNotificationProviders,
  createResendProviderFromEnv,
  createTwilioProviderFromEnv,
} from "./provider-resolution.js"
export type { LocalProviderOptions } from "./providers/local.js"
export { createLocalProvider } from "./providers/local.js"
export type {
  ResendFetch,
  ResendProviderOptions,
  ResendRenderedEmail,
} from "./providers/resend.js"
export { createResendProvider } from "./providers/resend.js"
export type { TwilioFetch, TwilioProviderOptions, TwilioRenderedSms } from "./providers/twilio.js"
export { createTwilioProvider } from "./providers/twilio.js"
export { createNotificationsRoutes } from "./routes.js"
export type {
  NewNotificationDelivery,
  NewNotificationReminderRule,
  NewNotificationReminderRun,
  NewNotificationTemplate,
  NotificationDelivery,
  NotificationReminderRule,
  NotificationReminderRun,
  NotificationsHonoModule,
  NotificationTemplate,
} from "./schema.js"

export {
  notificationChannelEnum,
  notificationDeliveries,
  notificationDeliveryStatusEnum,
  notificationReminderRules,
  notificationReminderRunStatusEnum,
  notificationReminderRuns,
  notificationReminderStatusEnum,
  notificationReminderTargetTypeEnum,
  notificationsModule,
  notificationTargetTypeEnum,
  notificationTemplateStatusEnum,
  notificationTemplates,
} from "./schema.js"
export type { NotificationService } from "./service.js"
export {
  createDefaultBookingDocumentAttachment,
  createNotificationService,
  NotificationError,
  notificationsService,
  renderNotificationTemplate,
} from "./service.js"
export type {
  BookingDocumentAttachmentResolver,
  BookingDocumentsSentEvent,
  SendBookingDocumentsRuntimeOptions,
} from "./service-booking-documents.js"
export { bookingDocumentNotificationsService } from "./service-booking-documents.js"
export { sendDueNotificationReminders } from "./tasks/index.js"
export type {
  NotificationAttachment,
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
} from "./types.js"
export {
  bookingDocumentBundleItemSchema,
  bookingDocumentBundleSchema,
  insertNotificationReminderRuleSchema,
  insertNotificationTemplateSchema,
  notificationAttachmentSchema,
  notificationChannelSchema,
  notificationDeliveryListQuerySchema,
  notificationDeliveryStatusSchema,
  notificationDocumentSourceSchema,
  notificationDocumentTypeSchema,
  notificationReminderRuleListQuerySchema,
  notificationReminderRunListQuerySchema,
  notificationReminderRunStatusSchema,
  notificationReminderStatusSchema,
  notificationReminderTargetTypeSchema,
  notificationTargetTypeSchema,
  notificationTemplateListQuerySchema,
  notificationTemplateStatusSchema,
  runDueRemindersSchema,
  sendBookingDocumentsNotificationResultSchema,
  sendBookingDocumentsNotificationSchema,
  sendInvoiceNotificationSchema,
  sendNotificationSchema,
  sendPaymentSessionNotificationSchema,
  updateNotificationReminderRuleSchema,
  updateNotificationTemplateSchema,
} from "./validation.js"

export function createNotificationsHonoModule(
  options?: Parameters<typeof createNotificationsRoutes>[0],
): HonoModule {
  return {
    module: notificationsModule,
    routes: createNotificationsRoutes(options),
  }
}
