import { createLocalProvider } from "./providers/local.js"
import { createResendProvider } from "./providers/resend.js"
import { createTwilioProvider } from "./providers/twilio.js"
import type { NotificationProvider } from "./types.js"

type NotificationProviderEnv = {
  RESEND_API_KEY?: unknown
  EMAIL_FROM?: unknown
  TWILIO_ACCOUNT_SID?: unknown
  TWILIO_AUTH_TOKEN?: unknown
  TWILIO_SMS_FROM?: unknown
}

export interface DefaultNotificationProviderOptions {
  includeLocal?: boolean
  emailProvider?: "resend" | null
  smsProvider?: "twilio" | null
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

export function createTwilioProviderFromEnv(env: NotificationProviderEnv) {
  if (
    typeof env.TWILIO_ACCOUNT_SID === "string" &&
    env.TWILIO_ACCOUNT_SID &&
    typeof env.TWILIO_AUTH_TOKEN === "string" &&
    env.TWILIO_AUTH_TOKEN &&
    typeof env.TWILIO_SMS_FROM === "string" &&
    env.TWILIO_SMS_FROM
  ) {
    return createTwilioProvider({
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      from: env.TWILIO_SMS_FROM,
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

  if (options.smsProvider === "twilio") {
    const twilio = createTwilioProviderFromEnv(env)
    if (twilio) {
      providers.push(twilio)
    }
  }

  if (options.customProviders?.length) {
    providers.push(...options.customProviders)
  }

  return providers
}
