import type {
  CheckVerifyInput,
  StartVerifyInput,
  VerifyAttempt,
  VerifyCheckResult,
  VerifyProvider,
} from "./types.js"

export class VerifyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "VerifyError"
  }
}

/**
 * Thin wrapper around a single {@link VerifyProvider}. Most templates use
 * exactly one verify backend at a time — the service exists to give callers
 * a stable surface even if the underlying provider changes.
 */
export interface VerifyService extends VerifyProvider {
  readonly provider: VerifyProvider
}

export function createVerifyService(provider: VerifyProvider): VerifyService {
  return {
    provider,
    name: provider.name,
    start: (input: StartVerifyInput): Promise<VerifyAttempt> => provider.start(input),
    check: (input: CheckVerifyInput): Promise<VerifyCheckResult> => provider.check(input),
  }
}
