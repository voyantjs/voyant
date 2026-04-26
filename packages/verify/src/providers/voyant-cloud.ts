import type { VerificationChannel, VoyantCloudClient } from "@voyantjs/voyant-cloud"

import type {
  CheckVerifyInput,
  StartVerifyInput,
  VerifyAttempt,
  VerifyAttemptStatus,
  VerifyChannel,
  VerifyCheckResult,
  VerifyProvider,
} from "../types.js"

export interface VoyantCloudVerifyProviderOptions {
  /** Cloud SDK client. Construct via `getVoyantCloudClient(env)`. */
  client: VoyantCloudClient
  /** Optional default delivery channel. Defaults to whatever the cloud picks. */
  defaultChannel?: VerifyChannel
  /** Optional default locale (forwarded to the cloud render layer). */
  defaultLocale?: string
}

function asAttemptStatus(value: string): VerifyAttemptStatus {
  switch (value) {
    case "approved":
    case "canceled":
    case "expired":
    case "failed":
    case "pending":
      return value
    default:
      return "pending"
  }
}

function asChannel(value: string): VerifyChannel {
  switch (value) {
    case "call":
    case "email":
    case "sms":
    case "whatsapp":
      return value
    default:
      return "sms"
  }
}

/**
 * Verify provider that delegates to the Voyant Cloud `/verify/v1/*`
 * endpoints. Cloud manages code generation, expiry, throttling, and
 * cross-channel delivery.
 */
export function createVoyantCloudVerifyProvider(
  options: VoyantCloudVerifyProviderOptions,
): VerifyProvider {
  return {
    name: "voyant-cloud-verify",
    async start(input: StartVerifyInput): Promise<VerifyAttempt> {
      const attempt = await options.client.verification.start({
        to: input.to,
        ...(input.channel || options.defaultChannel
          ? { channel: (input.channel ?? options.defaultChannel) as VerificationChannel }
          : {}),
        ...(input.locale || options.defaultLocale
          ? { locale: input.locale ?? options.defaultLocale }
          : {}),
      })

      return {
        id: attempt.id,
        channel: asChannel(attempt.channel),
        to: attempt.toValue,
        status: asAttemptStatus(attempt.status),
      }
    },
    async check(input: CheckVerifyInput): Promise<VerifyCheckResult> {
      const result = await options.client.verification.check({
        to: input.to,
        code: input.code,
      })

      return {
        id: result.id,
        channel: asChannel(result.channel),
        to: result.toValue,
        status: asAttemptStatus(result.status),
        valid: result.valid,
      }
    },
  }
}
