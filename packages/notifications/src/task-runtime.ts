import type { ExecutionLockManager } from "@voyantjs/core"

import { createDefaultNotificationProviders } from "./provider-resolution.js"
import type { NotificationProvider } from "./types.js"

export type NotificationTaskEnv = {
  RESEND_API_KEY?: unknown
  EMAIL_FROM?: unknown
}

export type ReminderDeliveryJob = {
  reminderRunId: string
}

export type NotificationTaskRuntime = {
  providers: ReadonlyArray<NotificationProvider>
  reminderSweepLockManager?: ExecutionLockManager
  enqueueReminderDelivery?: (job: ReminderDeliveryJob) => Promise<void>
}

export type NotificationTaskRuntimeOptions = {
  providers?: ReadonlyArray<NotificationProvider>
  reminderSweepLockManager?: ExecutionLockManager
  enqueueReminderDelivery?: (job: ReminderDeliveryJob) => Promise<void>
  resolveProviders?: (env: NotificationTaskEnv) => ReadonlyArray<NotificationProvider>
}

export function buildNotificationTaskRuntime(
  env: NotificationTaskEnv,
  options: NotificationTaskRuntimeOptions = {},
): NotificationTaskRuntime {
  return {
    providers:
      options.resolveProviders?.(env) ??
      options.providers ??
      createDefaultNotificationProviders(env),
    reminderSweepLockManager: options.reminderSweepLockManager,
    enqueueReminderDelivery: options.enqueueReminderDelivery,
  }
}
