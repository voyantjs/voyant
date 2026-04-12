import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { publicCustomerPortalService } from "./service-public.js"
import { customerPortalContactExistsQuerySchema } from "./validation-public.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
  }
}

export const customerPortalRoutes = new Hono<Env>().get("/contact-exists", async (c) => {
  const query = customerPortalContactExistsQuerySchema.parse(
    Object.fromEntries(new URL(c.req.url).searchParams),
  )

  return c.json({
    data: await publicCustomerPortalService.contactExists(c.get("db"), query.email),
  })
})

export type CustomerPortalRoutes = typeof customerPortalRoutes
