import type { NotificationProvider } from "./types.js"
import { createLocalProvider } from "./providers/local.js"
import { createResendProvider } from "./providers/resend.js"

type NotificationProviderEnv = {
  RESEND_API_KEY?: unknown
  EMAIL_FROM?: unknown
}

export interface DefaultNotificationProviderOptions {
  includeLocal?: boolean
  emailProvider?: "resend" | null
  customProviders?: ReadonlyArray<NotificationProvider>
}

export function createResendProviderFromEnv(env: NotificationProviderEnv) {
  if (
    typeof env.RESEND_API_KEY === "string" &&
    env.RESEND_API_KEY &&
    typeof env.EMAIL_FROM === "string" &&
    env.EMAIL_FROM
  ) {
    return createResendProvider({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
    })
  }

  return null
}

export function createDefaultNotificationProviders(
  env: NotificationProviderEnv,
  options: DefaultNotificationProviderOptions = {},
) {
  const providers: NotificationProvider[] = []

  if (options.includeLocal !== false) {
    providers.push(createLocalProvider())
  }

  if (options.emailProvider === "resend") {
    const resend = createResendProviderFromEnv(env)
    if (resend) {
      providers.push(resend)
    }
  }

  if (options.customProviders?.length) {
    providers.push(...options.customProviders)
  }

  return providers
}
