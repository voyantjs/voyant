import { Hono } from "hono"

import { availabilityCoreRoutes } from "./routes-core.js"
import { availabilityPickupRoutes } from "./routes-pickups.js"
import type { Env } from "./routes-shared.js"

export const availabilityRoutes = new Hono<Env>()
availabilityRoutes.route("/", availabilityCoreRoutes)
availabilityRoutes.route("/", availabilityPickupRoutes)

export type AvailabilityRoutes = typeof availabilityRoutes
