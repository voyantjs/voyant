import { createContainer, createEventBus } from "@voyantjs/core"
import { Hono } from "hono"

import { requireAuth } from "./middleware/auth.js"
import { cors } from "./middleware/cors.js"
import { db } from "./middleware/db.js"
import { errorBoundary, requestId } from "./middleware/error-boundary.js"
import { logger } from "./middleware/logger.js"
import { requireActor } from "./middleware/require-actor.js"
import { expandHonoPlugins } from "./plugin.js"
import type { VoyantAppConfig, VoyantBindings, VoyantVariables } from "./types.js"

export function createApp<TBindings extends VoyantBindings>(
  config: VoyantAppConfig<TBindings>,
): Hono<{ Bindings: TBindings; Variables: VoyantVariables }> {
  const app = new Hono<{ Bindings: TBindings; Variables: VoyantVariables }>()

  // Expand plugins into their constituent modules/extensions before mounting
  const expanded = config.plugins ? expandHonoPlugins(config.plugins) : null
  const allModules = [...(config.modules ?? []), ...(expanded?.modules ?? [])]
  const allExtensions = [...(config.extensions ?? []), ...(expanded?.extensions ?? [])]
  const eventBus = config.eventBus ?? createEventBus()

  // Module container — registered services are resolvable from routes
  const container = createContainer()
  for (const mod of allModules) {
    if (mod.module.service !== undefined) {
      container.register(mod.module.name, mod.module.service)
    }
  }
  for (const sub of expanded?.subscribers ?? []) {
    eventBus.subscribe(sub.event, sub.handler)
  }

  let bootstrapPromise: Promise<void> | null = null
  function ensureRuntimeBootstrapped(bindings: TBindings) {
    if (!bootstrapPromise) {
      bootstrapPromise = (async () => {
        const ctx = { bindings, container, eventBus }

        for (const plugin of config.plugins ?? []) {
          await plugin.bootstrap?.(ctx)
        }
        for (const mod of allModules) {
          await mod.module.bootstrap?.(ctx)
        }
        for (const ext of allExtensions) {
          await ext.extension.bootstrap?.(ctx)
        }
      })()
    }

    return bootstrapPromise
  }

  app.use("*", async (c, next) => {
    c.set("container", container)
    c.set("eventBus", eventBus)
    await ensureRuntimeBootstrapped(c.env)
    return next()
  })

  // Request ID header
  app.use("*", requestId)

  // Structured logger
  app.use("*", logger(config.logger))

  // Global error boundary
  app.use("*", errorBoundary)

  // CORS (allowlist via env CORS_ALLOWLIST)
  app.use("*", cors())

  // Health check (public, no auth)
  app.get("/health", (c) => c.json({ status: "ok" }))

  // App-owned auth handler (must be before auth middleware — these routes are public)
  const authHandler = config.auth?.handler
  if (authHandler) {
    app.all("/auth/*", async (c) => {
      const authApp = authHandler(c.env)
      return authApp.fetch(c.req.raw, c.env, c.executionCtx)
    })
  }

  // Auth middleware for all other routes
  app.use("*", requireAuth(config.db, { publicPaths: config.publicPaths, auth: config.auth }))

  // DB middleware — sets c.var.db for all downstream handlers
  app.use("*", db(config.db))

  // Actor guards for the two API surfaces
  app.use("/v1/admin/*", requireActor("staff"))
  app.use("/v1/public/*", requireActor("customer", "partner", "supplier"))

  // Mount module routes
  for (const mod of allModules) {
    if (mod.adminRoutes) {
      app.route(`/v1/admin/${mod.module.name}`, mod.adminRoutes)
    }
    if (mod.publicRoutes) {
      app.route(`/v1/public/${mod.module.name}`, mod.publicRoutes)
    }
    if (mod.routes) {
      app.route(`/v1/${mod.module.name}`, mod.routes)
    }
  }

  // Mount extension routes
  for (const ext of allExtensions) {
    if (ext.adminRoutes) {
      app.route(`/v1/admin/${ext.extension.module}`, ext.adminRoutes)
    }
    if (ext.publicRoutes) {
      app.route(`/v1/public/${ext.extension.module}`, ext.publicRoutes)
    }
    if (ext.routes) {
      app.route(`/v1/${ext.extension.module}`, ext.routes)
    }
  }

  // Additional routes
  if (config.additionalRoutes) {
    config.additionalRoutes(app)
  }

  return app
}
