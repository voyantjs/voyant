import { Hono } from "hono"

import { createStorefrontService, type StorefrontServiceOptions } from "./service.js"

export function createStorefrontPublicRoutes(options?: StorefrontServiceOptions) {
  const storefrontService = createStorefrontService(options)

  return new Hono().get("/settings", (c) => {
    return c.json({ data: storefrontService.getSettings() })
  })
}

export type StorefrontPublicRoutes = ReturnType<typeof createStorefrontPublicRoutes>
