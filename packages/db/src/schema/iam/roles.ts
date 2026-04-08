import { pgEnum } from "drizzle-orm/pg-core"
import { z } from "zod"

export const roles = pgEnum("roles", [
  "super-admin",
  "admin",
  "editor",
  "viewer",
  "member",
  "guest",
])

export const rolesSchema = z.enum(roles.enumValues)
export type Role = z.infer<typeof rolesSchema>
