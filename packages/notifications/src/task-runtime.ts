import { createDefaultNotificationProviders } from "./provider-resolution.js"
import type { NotificationProvider } from "./types.js"

export type NotificationTaskEnv = {
  RESEND_API_KEY?: unknown
  EMAIL_FROM?: unknown
}

export type NotificationTaskRuntime = {
  providers: ReadonlyArray<NotificationProvider>
}

export type NotificationTaskRuntimeOptions = {
  providers?: ReadonlyArray<NotificationProvider>
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
  }
}
