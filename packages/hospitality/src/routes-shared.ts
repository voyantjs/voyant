import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export function notFound(entity: string) {
  return { error: `${entity} not found` } as const
}
