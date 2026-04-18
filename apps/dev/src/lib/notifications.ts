import { createInMemoryExecutionLockManager } from "@voyantjs/core"
import {
  buildNotificationTaskRuntime,
  createDefaultNotificationProviders,
  type NotificationTaskRuntimeOptions,
} from "@voyantjs/notifications"

export const resolveNotificationProviders = (env: Record<string, unknown>) =>
  createDefaultNotificationProviders(env, { emailProvider: "resend" })

const reminderSweepLockManager = createInMemoryExecutionLockManager()

export const getNotificationTaskRuntime = (
  env: Record<string, unknown>,
  options: Pick<NotificationTaskRuntimeOptions, "enqueueReminderDelivery"> = {},
) =>
  buildNotificationTaskRuntime(env, {
    resolveProviders: resolveNotificationProviders,
    reminderSweepLockManager,
    enqueueReminderDelivery: options.enqueueReminderDelivery,
  })
