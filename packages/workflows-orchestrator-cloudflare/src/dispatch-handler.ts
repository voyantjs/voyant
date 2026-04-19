// Builds a `StepHandler` (the thing the orchestrator calls on every
// invocation) by routing the request through a Workers-for-Platforms
// dispatch namespace to the tenant's bundled Worker.
//
// The tenant Worker is expected to mount `@voyantjs/workflows/handler`
// at `POST /__voyant/workflow-step` (see docs/runtime-protocol.md §2.1).

import {
  createHttpStepHandler,
  type StepHandler,
  type WorkflowStepRequest,
} from "@voyantjs/workflows-orchestrator"
import type { DispatchNamespaceLike } from "./types.js"

export interface DispatchHandlerDeps {
  dispatcher: DispatchNamespaceLike
  /** Optional HMAC signer for the X-Voyant-Dispatch-Auth header. */
  sign?: (body: string) => Promise<string> | string
  /** Optional logger for step-level observability. */
  logger?: (level: "info" | "warn" | "error", msg: string, data?: object) => void
  /** Base URL to present to the tenant. Defaults to `https://tenant.voyant.internal`. */
  baseUrl?: string
}

/**
 * The dispatcher binding expects a name corresponding to the tenant
 * script slot. `createDispatchStepHandler` binds the step handler to
 * a specific tenant script; different tenants need different handlers
 * (trivial via `createDispatchStepHandler(...)` with the script name
 * resolved from the run's tenantMeta).
 */
export function createDispatchStepHandler(
  tenantScript: string,
  deps: DispatchHandlerDeps,
): StepHandler {
  const baseUrl = deps.baseUrl ?? "https://tenant.voyant.internal"
  return createHttpStepHandler({
    sign: deps.sign ? (body) => deps.sign!(body) : undefined,
    logger: deps.logger,
    resolveTarget(_req: WorkflowStepRequest) {
      const binding = deps.dispatcher.get(tenantScript)
      return {
        url: `${baseUrl}/__voyant/workflow-step`,
        label: tenantScript,
        fetch(request: Request) {
          return binding.fetch(request)
        },
      }
    },
  })
}
