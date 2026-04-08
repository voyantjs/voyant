import type { NotificationProvider } from "../types.js"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { createDefaultNotificationProviders } from "../provider-resolution.js"
import { createNotificationService, notificationsService } from "../service.js"

type NotificationTaskEnv = {
  RESEND_API_KEY?: unknown
  EMAIL_FROM?: unknown
}

export async function sendDueNotificationReminders(
  db: PostgresJsDatabase,
  env: NotificationTaskEnv,
  input: { now?: string | null } = {},
  options: {
    resolveProviders?: (env: NotificationTaskEnv) => ReadonlyArray<NotificationProvider>
  } = {},
) {
  const dispatcher = createNotificationService(
    options.resolveProviders?.(env) ?? createDefaultNotificationProviders(env),
  )
  return notificationsService.runDueReminders(db, dispatcher, input)
}
