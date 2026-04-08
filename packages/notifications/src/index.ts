import type { HonoModule } from "@voyantjs/hono/module"

import { createNotificationsRoutes } from "./routes.js"
import { notificationsModule } from "./schema.js"

export type { LocalProviderOptions } from "./providers/local.js"
export { createLocalProvider } from "./providers/local.js"
export {
  createDefaultNotificationProviders,
  createResendProviderFromEnv,
} from "./provider-resolution.js"
export type { DefaultNotificationProviderOptions } from "./provider-resolution.js"
export type {
  ResendFetch,
  ResendProviderOptions,
  ResendRenderedEmail,
} from "./providers/resend.js"
export { createResendProvider } from "./providers/resend.js"

export type { NotificationService } from "./service.js"
export {
  createNotificationService,
  notificationsService,
  NotificationError,
  renderNotificationTemplate,
} from "./service.js"

export {
  notificationTemplates,
  notificationDeliveries,
  notificationReminderRules,
  notificationReminderRuns,
  notificationChannelEnum,
  notificationTemplateStatusEnum,
  notificationDeliveryStatusEnum,
  notificationTargetTypeEnum,
  notificationReminderStatusEnum,
  notificationReminderTargetTypeEnum,
  notificationReminderRunStatusEnum,
  notificationsModule,
} from "./schema.js"
export type {
  NotificationTemplate,
  NewNotificationTemplate,
  NotificationDelivery,
  NewNotificationDelivery,
  NotificationReminderRule,
  NewNotificationReminderRule,
  NotificationReminderRun,
  NewNotificationReminderRun,
  NotificationsHonoModule,
} from "./schema.js"

export {
  notificationChannelSchema,
  notificationTemplateStatusSchema,
  notificationDeliveryStatusSchema,
  notificationTargetTypeSchema,
  notificationReminderStatusSchema,
  notificationReminderTargetTypeSchema,
  notificationReminderRunStatusSchema,
  insertNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  notificationTemplateListQuerySchema,
  notificationDeliveryListQuerySchema,
  insertNotificationReminderRuleSchema,
  updateNotificationReminderRuleSchema,
  notificationReminderRuleListQuerySchema,
  notificationReminderRunListQuerySchema,
  runDueRemindersSchema,
  sendPaymentSessionNotificationSchema,
  sendInvoiceNotificationSchema,
  sendNotificationSchema,
} from "./validation.js"

export { createNotificationsRoutes } from "./routes.js"
export { sendDueNotificationReminders } from "./tasks/index.js"
export type {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
} from "./types.js"

export function createNotificationsHonoModule(options?: Parameters<typeof createNotificationsRoutes>[0]): HonoModule {
  return {
    module: notificationsModule,
    routes: createNotificationsRoutes(options),
  }
}
