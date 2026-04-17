import type { EventBus } from "@voyantjs/core"

import type { ContractDocumentGenerator, ContractsRouteOptions } from "./routes.js"

export type ContractsRouteRuntime = {
  documentGenerator?: ContractDocumentGenerator
  eventBus?: EventBus
}

export const CONTRACTS_ROUTE_RUNTIME_CONTAINER_KEY = "providers.legal.contracts.runtime"

export function buildContractsRouteRuntime(
  bindings: Record<string, unknown>,
  options: ContractsRouteOptions = {},
): ContractsRouteRuntime {
  return {
    documentGenerator: options.resolveDocumentGenerator?.(bindings) ?? options.documentGenerator,
    eventBus: options.resolveEventBus?.(bindings) ?? options.eventBus,
  }
}
