import type { Module } from "@voyantjs/core"
import type { HonoModule } from "@voyantjs/hono/module"
import { Hono } from "hono"

import { contractsAdminRoutes, contractsPublicRoutes } from "./contracts/routes.js"
import { policiesAdminRoutes, policiesPublicRoutes } from "./policies/routes.js"

import { contractsLinkable } from "./contracts/index.js"
import { policiesLinkable } from "./policies/index.js"

export const legalLinkable = {
  ...contractsLinkable,
  ...policiesLinkable,
}

export const legalModule: Module = {
  name: "legal",
  linkable: legalLinkable,
}

const legalAdminRoutes = new Hono()
  .route("/contracts", contractsAdminRoutes)
  .route("/policies", policiesAdminRoutes)

const legalPublicRoutes = new Hono()
  .route("/contracts", contractsPublicRoutes)
  .route("/policies", policiesPublicRoutes)

export const legalHonoModule: HonoModule = {
  module: legalModule,
  adminRoutes: legalAdminRoutes,
  publicRoutes: legalPublicRoutes,
}

export * from "./contracts/index.js"
export * from "./policies/index.js"
