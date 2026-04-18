import type { Context } from "hono"

import { UnauthorizedApiError } from "../validation.js"

export function requireUserId(c: Context): string {
  const userId = c.get("userId")
  if (!userId) {
    throw new UnauthorizedApiError()
  }

  return userId
}
