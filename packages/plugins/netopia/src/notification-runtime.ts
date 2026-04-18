import {
  createDefaultNotificationProviders,
  createNotificationService,
  type NotificationProvider,
  type NotificationService,
} from "@voyantjs/notifications"

import type { NetopiaRuntimeOptions } from "./types.js"

export type NetopiaNotificationRuntime = {
  dispatcher: NotificationService
}

export type NetopiaNotificationRuntimeOptions = Pick<
  NetopiaRuntimeOptions,
  "resolveNotificationProviders"
> & {
  notificationProviders?: ReadonlyArray<NotificationProvider>
}

export function buildNetopiaNotificationRuntime(
  bindings: Record<string, unknown> | undefined,
  runtimeOptions: NetopiaNotificationRuntimeOptions = {},
  dispatcherOverride?: NotificationService,
): NetopiaNotificationRuntime {
  if (dispatcherOverride) {
    return {
      dispatcher: dispatcherOverride,
    }
  }

  const providers =
    runtimeOptions.resolveNotificationProviders?.(bindings ?? {}) ??
    runtimeOptions.notificationProviders ??
    createDefaultNotificationProviders(bindings ?? {})

  return {
    dispatcher: createNotificationService(providers),
  }
}
