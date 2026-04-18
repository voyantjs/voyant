import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { createNotificationService, notificationsService } from "../service.js"
import {
  buildNotificationTaskRuntime,
  type NotificationTaskEnv,
  type NotificationTaskRuntimeOptions,
} from "../task-runtime.js"

export async function sendDueNotificationReminders(
  db: PostgresJsDatabase,
  env: NotificationTaskEnv,
  input: { now?: string | null } = {},
  options: NotificationTaskRuntimeOptions = {},
) {
  const runtime = buildNotificationTaskRuntime(env, options)
  const dispatcher = createNotificationService(runtime.providers)
  const runSweep = () => notificationsService.runDueReminders(db, dispatcher, input)

  if (!runtime.reminderSweepLockManager) {
    return runSweep()
  }

  const result = await runtime.reminderSweepLockManager.runExclusive(
    "notifications:due-reminders",
    runSweep,
  )

  if (result.executed) {
    return result.value
  }

  return {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  }
}
