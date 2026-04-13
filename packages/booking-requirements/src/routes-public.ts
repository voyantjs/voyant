import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { bookingRequirementsService } from "./service.js"
import { publicTransportRequirementsQuerySchema } from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const publicBookingRequirementsRoutes = new Hono<Env>().get(
  "/products/:productId/transport-requirements",
  async (c) => {
    const query = publicTransportRequirementsQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )

    const result = await bookingRequirementsService.getPublicTransportRequirements(
      c.get("db"),
      c.req.param("productId"),
      query,
    )

    if (!result) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: result })
  },
)

export type PublicBookingRequirementsRoutes = typeof publicBookingRequirementsRoutes
