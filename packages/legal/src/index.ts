import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"
import { Hono } from "hono"
import { contractsLinkable } from "./contracts/index.js"
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

  return {
    module: legalModule,
    adminRoutes: legalAdminRoutes,
    publicRoutes: legalPublicRoutes,
  }
}

export const legalHonoModule: HonoModule = createLegalHonoModule()

export * from "./contracts/index.js"
export type { ContractsRouteOptions } from "./contracts/routes.js"
export * from "./policies/index.js"
