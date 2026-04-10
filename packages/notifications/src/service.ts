export type { NotificationService } from "./service-shared.js"
export {
  createNotificationService,
  NotificationError,
  renderNotificationTemplate,
} from "./service-shared.js"

import {
  getDeliveryById,
  listDeliveries,
  sendInvoiceNotification,
  sendNotification,
  sendPaymentSessionNotification,
} from "./service-deliveries.js"
import { runDueReminders } from "./service-reminders.js"
import {
  createReminderRule,
  createTemplate,
  getReminderRuleById,
  getTemplateById,
  getTemplateBySlug,
  listReminderRules,
  listReminderRuns,
  listTemplates,
  updateReminderRule,
  updateTemplate,
} from "./service-templates.js"

export const notificationsService = {
  listTemplates,
  getTemplateById,
  getTemplateBySlug,
  createTemplate,
  updateTemplate,
  listDeliveries,
  getDeliveryById,
  sendNotification,
  listReminderRules,
  getReminderRuleById,
  createReminderRule,
  updateReminderRule,
  listReminderRuns,
  runDueReminders,
  sendPaymentSessionNotification,
  sendInvoiceNotification,
}
