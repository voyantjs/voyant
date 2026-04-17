import type {
  VoyantVariables as CoreVoyantVariables,
  EventBus,
  ModuleContainer,
  VoyantAuthContext,
  VoyantPermission,
} from "@voyantjs/core"
import type { KVStore } from "@voyantjs/utils/cache"
import type { NeonHttpDatabase } from "drizzle-orm/neon-http"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { Hono } from "hono"

import type { HonoExtension, HonoModule } from "./module.js"
import type { HonoPlugin } from "./plugin.js"

export interface VoyantExecutionContext {
  waitUntil?: (promise: Promise<unknown>) => void
  passThroughOnException?: () => void
}

export interface VoyantBindings {
  INTERNAL_API_KEY?: string
  SESSION_CLAIMS_SECRET?: string
  BETTER_AUTH_SECRET?: string
  DATABASE_URL: string
  CORS_ALLOWLIST?: string
  APP_URL?: string
  DASH_BASE_URL?: string
  API_BASE_URL?: string
  RATE_LIMIT?: KVStore
  CACHE?: KVStore
}

export type VoyantDb = PostgresJsDatabase | NeonHttpDatabase
export type VoyantVariables = CoreVoyantVariables & {
  db: VoyantDb
  /** Shared app/runtime container for explicit service resolution. */
  container: ModuleContainer
  eventBus: EventBus
}

export type DbFactory<TBindings extends VoyantBindings = VoyantBindings> = (
  env: TBindings,
) => VoyantDb

export type VoyantRequestAuthContext = VoyantAuthContext & {
  userId: string
}

export interface LogEntry {
  method: string
  path: string
  status: number
  durationMs: number
}

export interface LoggerProvider {
  log(entry: LogEntry): void
}

export interface VoyantAuthResolveArgs<TBindings extends VoyantBindings = VoyantBindings> {
  request: Request
  env: TBindings
  db: VoyantDb
  ctx?: VoyantExecutionContext
}

export interface VoyantAuthPermissionArgs<TBindings extends VoyantBindings = VoyantBindings>
  extends VoyantAuthResolveArgs<TBindings> {
  permission: VoyantPermission
  auth: VoyantRequestAuthContext
}

export interface VoyantAuthIntegration<TBindings extends VoyantBindings = VoyantBindings> {
  handler?: (env: TBindings) => {
    fetch: (
      req: Request,
      env: TBindings,
      ctx?: VoyantExecutionContext,
    ) => Response | Promise<Response>
  }
  resolve?: (
    args: VoyantAuthResolveArgs<TBindings>,
  ) => Promise<VoyantRequestAuthContext | null> | VoyantRequestAuthContext | null
  hasPermission?: (args: VoyantAuthPermissionArgs<TBindings>) => Promise<boolean> | boolean
}

export interface VoyantAppConfig<TBindings extends VoyantBindings = VoyantBindings> {
  db: DbFactory<TBindings>
  modules?: HonoModule[]
  extensions?: HonoExtension[]
  plugins?: HonoPlugin[]
  eventBus?: EventBus
  auth?: VoyantAuthIntegration<TBindings>
  publicPaths?: string[]
  logger?: LoggerProvider
  // biome-ignore lint/suspicious/noExplicitAny: Hono sub-apps have varied env generics
  additionalRoutes?: (app: Hono<any>) => void
}
