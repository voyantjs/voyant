import { createPostgresAdvisoryLockManager } from "@voyantjs/db/runtime"
import {
  buildNotificationTaskRuntime,
  createDefaultNotificationProviders,
} from "@voyantjs/notifications"

export const resolveNotificationProviders = (env: Record<string, unknown>) =>
  createDefaultNotificationProviders(env, {
    emailProvider: "resend",
    smsProvider: "twilio",
  })

function resolveReminderSweepLockManager(env: Record<string, unknown>) {
  const connectionString =
    typeof env.DATABASE_URL === "string" && env.DATABASE_URL.length > 0 ? env.DATABASE_URL : null

  return connectionString
    ? createPostgresAdvisoryLockManager(connectionString, {
        namespace: "dmc",
      })
    : undefined
}

export const getNotificationTaskRuntime = (env: Record<string, unknown>) =>
  buildNotificationTaskRuntime(env, {
    resolveProviders: resolveNotificationProviders,
    reminderSweepLockManager: resolveReminderSweepLockManager(env),
  })
