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
  return notificationsService.runDueReminders(db, dispatcher, input)
}
