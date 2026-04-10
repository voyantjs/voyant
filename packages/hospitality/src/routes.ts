import { Hono } from "hono"

import { hospitalityAccommodationRoutes } from "./routes-accommodation.js"
import { hospitalityOperationsRoutes } from "./routes-operations.js"
import type { Env } from "./routes-shared.js"

export const hospitalityRoutes = new Hono<Env>()
  .route("/", hospitalityAccommodationRoutes)
  .route("/", hospitalityOperationsRoutes)

export type HospitalityRoutes = typeof hospitalityRoutes
