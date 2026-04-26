import type {
  CheckVerifyInput,
  StartVerifyInput,
  VerifyAttempt,
  VerifyChannel,
  VerifyCheckResult,
  VerifyProvider,
} from "../types.js"

export interface LocalVerifyProviderOptions {
  /**
   * Generate the OTP for an attempt. Defaults to a 6-digit zero-padded
   * pseudo-random code. Tests can pass `() => "000000"` for determinism.
   */
  generateCode?: (input: StartVerifyInput) => string
  /**
   * Sink for the generated code. Defaults to `console.log`. Tests can pass
   * `vi.fn()` to capture without console noise.
   */
  sink?: (attempt: VerifyAttempt & { code: string }) => void
  /** Default channel when the caller does not supply one. */
  defaultChannel?: VerifyChannel
  /** Provider name (defaults to `"local-verify"`). */
  name?: string
}

interface StoredAttempt {
  id: string
  channel: VerifyChannel
  to: string
  code: string
  consumed: boolean
}

function defaultGenerateCode(): string {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")
}

let counter = 0

/**
 * Development/test verify provider. Generates codes in-memory, hands them to
 * a sink (console by default), and validates them on `check`. Never makes
 * network calls.
 */
export function createLocalVerifyProvider(
  options: LocalVerifyProviderOptions = {},
): VerifyProvider {
  const name = options.name ?? "local-verify"
  const defaultChannel = options.defaultChannel ?? "sms"
  const generateCode = options.generateCode ?? defaultGenerateCode
  const sink =
    options.sink ??
    ((attempt: VerifyAttempt & { code: string }) => {
      console.log(`[verify:${name}]`, attempt)
    })

  const attemptsByRecipient = new Map<string, StoredAttempt>()

  return {
    name,
    async start(input: StartVerifyInput): Promise<VerifyAttempt> {
      counter += 1
      const code = generateCode(input)
      const attempt: StoredAttempt = {
        id: `${name}_${counter}`,
        channel: input.channel ?? defaultChannel,
        to: input.to,
        code,
        consumed: false,
      }
      attemptsByRecipient.set(input.to, attempt)
      const result: VerifyAttempt = {
        id: attempt.id,
        channel: attempt.channel,
        to: attempt.to,
        status: "pending",
      }
      sink({ ...result, code: attempt.code })
      return result
    },
    async check(input: CheckVerifyInput): Promise<VerifyCheckResult> {
      const attempt = attemptsByRecipient.get(input.to)
      if (!attempt || attempt.consumed) {
        return {
          id: attempt?.id ?? `${name}_unknown`,
          channel: attempt?.channel ?? defaultChannel,
          to: input.to,
          status: "expired",
          valid: false,
        }
      }
      const valid = attempt.code === input.code
      if (valid) {
        attempt.consumed = true
      }
      return {
        id: attempt.id,
        channel: attempt.channel,
        to: attempt.to,
        status: valid ? "approved" : "pending",
        valid,
      }
    },
  }
}
