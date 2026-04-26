/**
 * Channel over which a verification challenge is delivered.
 */
export type VerifyChannel = "sms" | "call" | "email" | "whatsapp"

/**
 * Status of a verification attempt as known to the provider.
 */
export type VerifyAttemptStatus = "pending" | "approved" | "canceled" | "expired" | "failed"

/**
 * Input to {@link VerifyProvider.start}.
 */
export interface StartVerifyInput {
  /** Recipient (email address, phone number, …) the challenge is sent to. */
  to: string
  /** Delivery channel. Provider may default when omitted. */
  channel?: VerifyChannel
  /** Locale hint for the rendered message (e.g. `"ro"`, `"en-GB"`). */
  locale?: string
}

/**
 * Input to {@link VerifyProvider.check}.
 */
export interface CheckVerifyInput {
  /** Recipient (must match the value passed to {@link VerifyProvider.start}). */
  to: string
  /** Code the user submitted. */
  code: string
}

/**
 * Result of {@link VerifyProvider.start}.
 */
export interface VerifyAttempt {
  /** Provider-assigned attempt id. */
  id: string
  /** Resolved channel the challenge was sent over. */
  channel: VerifyChannel
  /** Recipient the challenge was sent to. */
  to: string
  /** Provider-known attempt status. */
  status: VerifyAttemptStatus
}

/**
 * Result of {@link VerifyProvider.check}.
 */
export interface VerifyCheckResult extends VerifyAttempt {
  /** True iff the submitted code matched and the attempt is approved. */
  valid: boolean
}

/**
 * Pluggable verification provider. Implementations send a one-time code over
 * a channel and validate the code the user echoes back.
 *
 * Built-in implementations:
 * - `createLocalVerifyProvider` — in-memory codes for dev/tests
 * - `createVoyantCloudVerifyProvider` — Voyant Cloud verify API
 */
export interface VerifyProvider {
  /** Unique provider name (e.g. `"voyant-cloud-verify"`, `"local"`). */
  readonly name: string
  /** Send a verification challenge to the recipient. */
  start(input: StartVerifyInput): Promise<VerifyAttempt>
  /** Validate a code the user submitted. */
  check(input: CheckVerifyInput): Promise<VerifyCheckResult>
}
