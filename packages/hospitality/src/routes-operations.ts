import { Hono } from "hono"

import { hospitalityInventoryRoutes } from "./routes-inventory.js"
import type { Env } from "./routes-shared.js"
import { hospitalityStayRoutes } from "./routes-stays.js"

export const hospitalityOperationsRoutes = new Hono<Env>()
  .route("/", hospitalityInventoryRoutes)
  .route("/", hospitalityStayRoutes)
