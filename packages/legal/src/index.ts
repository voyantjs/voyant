import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"
import { Hono } from "hono"
import { contractsLinkable } from "./contracts/index.js"
import {
  buildContractsRouteRuntime,
  CONTRACTS_ROUTE_RUNTIME_CONTAINER_KEY,
} from "./contracts/route-runtime.js"
import {
  type ContractsRouteOptions,
  createContractsAdminRoutes,
  createContractsPublicRoutes,
} from "./contracts/routes.js"
import { policiesLinkable } from "./policies/index.js"
import { policiesAdminRoutes, policiesPublicRoutes } from "./policies/routes.js"

export const legalLinkable = {
  ...contractsLinkable,
  ...policiesLinkable,
}

export const legalModule: Module = {
  name: "legal",
  linkable: legalLinkable,
}

export function createLegalHonoModule(options: ContractsRouteOptions = {}): HonoModule {
  const legalAdminRoutes = new Hono()
    .route("/contracts", createContractsAdminRoutes(options))
    .route("/policies", policiesAdminRoutes)

  const legalPublicRoutes = new Hono()
    .route("/contracts", createContractsPublicRoutes())
    .route("/policies", policiesPublicRoutes)

  const module: Module = {
    ...legalModule,
    bootstrap: ({ bindings, container }) => {
      container.register(
        CONTRACTS_ROUTE_RUNTIME_CONTAINER_KEY,
        buildContractsRouteRuntime(bindings as Record<string, unknown>, options),
      )
    },
  }

  return {
    module,
    adminRoutes: legalAdminRoutes,
    publicRoutes: legalPublicRoutes,
  }
}

export const legalHonoModule: HonoModule = createLegalHonoModule()

export * from "./contracts/index.js"
export {
  buildContractsRouteRuntime,
  CONTRACTS_ROUTE_RUNTIME_CONTAINER_KEY,
  type ContractsRouteRuntime,
} from "./contracts/route-runtime.js"
export type { ContractsRouteOptions } from "./contracts/routes.js"
export * from "./policies/index.js"
