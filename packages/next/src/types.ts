import type { VoyantAuthContext, VoyantPermission } from "@voyantjs/core"
import type { NeonHttpDatabase } from "drizzle-orm/neon-http"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export type VoyantDb = PostgresJsDatabase | NeonHttpDatabase

export type VoyantNextParams = Record<string, string | string[] | undefined>

export interface VoyantNextRouteInput<TParams extends VoyantNextParams = VoyantNextParams> {
  params?: TParams | Promise<TParams>
}

export type VoyantNextRequestAuthContext = VoyantAuthContext & {
  userId: string
}

export type VoyantNextDbFactory<TParams extends VoyantNextParams = VoyantNextParams> =
  | VoyantDb
  | ((args: { request: Request; params: TParams }) => VoyantDb | Promise<VoyantDb>)

export interface VoyantNextAuthResolveArgs<TParams extends VoyantNextParams = VoyantNextParams> {
  request: Request
  db: VoyantDb
  params: TParams
}

export interface VoyantNextAuthPermissionArgs<TParams extends VoyantNextParams = VoyantNextParams>
  extends VoyantNextAuthResolveArgs<TParams> {
  permission: VoyantPermission
  auth: VoyantNextRequestAuthContext
}

export interface VoyantNextAuthIntegration<TParams extends VoyantNextParams = VoyantNextParams> {
  resolve?: (
    args: VoyantNextAuthResolveArgs<TParams>,
  ) => Promise<VoyantNextRequestAuthContext | null> | VoyantNextRequestAuthContext | null
  hasPermission?: (args: VoyantNextAuthPermissionArgs<TParams>) => Promise<boolean> | boolean
}

export interface VoyantNextConfig<TParams extends VoyantNextParams = VoyantNextParams> {
  db: VoyantNextDbFactory<TParams>
  auth?: VoyantNextAuthIntegration<TParams>
}

export interface VoyantNextRouteContext<TParams extends VoyantNextParams = VoyantNextParams> {
  request: Request
  params: TParams
  db: VoyantDb
  auth: VoyantNextRequestAuthContext | null
}

export type VoyantNextHandler<TParams extends VoyantNextParams = VoyantNextParams> = (
  ctx: VoyantNextRouteContext<TParams>,
) => Response | Promise<Response>

export type VoyantNextRouteHandler<TParams extends VoyantNextParams = VoyantNextParams> = (
  request: Request,
  context: VoyantNextRouteInput<TParams>,
) => Response | Promise<Response>
