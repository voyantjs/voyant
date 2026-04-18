import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"

import {
  buildNotificationsRouteRuntime,
  createNotificationsRoutes,
  NOTIFICATIONS_ROUTE_RUNTIME_CONTAINER_KEY,
  type NotificationsRoutesOptions,
} from "./routes.js"
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
export type { NotificationsRouteRuntime, NotificationsRoutesOptions } from "./routes.js"
export {
  buildNotificationsRouteRuntime,
  createNotificationsRoutes,
  NOTIFICATIONS_ROUTE_RUNTIME_CONTAINER_KEY,
} from "./routes.js"
export type {
  NotificationTaskEnv,
  NotificationTaskRuntime,
  NotificationTaskRuntimeOptions,
} from "./task-runtime.js"
export { buildNotificationTaskRuntime } from "./task-runtime.js"
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
  notificationReminderRunDeliverySummarySchema,
  notificationReminderRunLinksSchema,
  notificationReminderRunListQuerySchema,
  notificationReminderRunListResponseSchema,
  notificationReminderRunRecordSchema,
  notificationReminderRunRuleSummarySchema,
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

export function createNotificationsHonoModule(options?: NotificationsRoutesOptions): HonoModule {
  const module: Module = {
    ...notificationsModule,
    bootstrap: ({ bindings, container }) => {
      container.register(
        NOTIFICATIONS_ROUTE_RUNTIME_CONTAINER_KEY,
        buildNotificationsRouteRuntime(bindings as Record<string, unknown>, options),
      )
    },
  }

  return {
    module,
    routes: createNotificationsRoutes(options),
  }
}
