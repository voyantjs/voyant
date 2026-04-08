import type { MiddlewareHandler } from "hono"

import type { LoggerProvider } from "../types.js"

export const consoleLoggerProvider: LoggerProvider = {
  log(entry) {
    console.log(`${entry.method} ${entry.path} → ${entry.status} (${entry.durationMs}ms)`)
  },
}

export function logger(provider?: LoggerProvider): MiddlewareHandler {
  const log = provider ?? consoleLoggerProvider
  return async (c, next) => {
    const start = Date.now()
    await next()
    const durationMs = Date.now() - start
    log.log({
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
    })
  }
}
