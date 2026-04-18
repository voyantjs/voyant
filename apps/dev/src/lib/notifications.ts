import { createInMemoryExecutionLockManager } from "@voyantjs/core"
import {
  buildNotificationTaskRuntime,
  createDefaultNotificationProviders,
} from "@voyantjs/notifications"

export const resolveNotificationProviders = (env: Record<string, unknown>) =>
  createDefaultNotificationProviders(env, { emailProvider: "resend" })

const reminderSweepLockManager = createInMemoryExecutionLockManager()

export const getNotificationTaskRuntime = (env: Record<string, unknown>) =>
  buildNotificationTaskRuntime(env, {
    resolveProviders: resolveNotificationProviders,
    reminderSweepLockManager,
  })
