import type { VoyantPermission } from "@voyantjs/core"

import { forbidden, serverError, unauthorized } from "./responses.js"
import type {
  VoyantDb,
  VoyantNextConfig,
  VoyantNextHandler,
  VoyantNextParams,
  VoyantNextRequestAuthContext,
  VoyantNextRouteHandler,
  VoyantNextRouteInput,
} from "./types.js"

function hasScope(scopes: string[] | null | undefined, permission: VoyantPermission): boolean {
  if (!scopes || scopes.length === 0) return false

  const { resource, action } = permission
  return (
    scopes.includes("*") ||
    scopes.includes(`${resource}:${action}`) ||
    scopes.includes(`${resource}:*`) ||
    scopes.includes(`*:${action}`)
  )
}

async function resolveParams<TParams extends VoyantNextParams>(
  input?: VoyantNextRouteInput<TParams>,
): Promise<TParams> {
  return ((await input?.params) ?? {}) as TParams
}

async function resolveDb<TParams extends VoyantNextParams>(
  config: VoyantNextConfig<TParams>,
  request: Request,
  params: TParams,
): Promise<VoyantDb> {
  return typeof config.db === "function" ? await config.db({ request, params }) : config.db
}

async function resolveAuth<TParams extends VoyantNextParams>(
  config: VoyantNextConfig<TParams>,
  request: Request,
  db: VoyantDb,
  params: TParams,
): Promise<VoyantNextRequestAuthContext | null> {
  if (!config.auth?.resolve) {
    return null
  }

  return (await config.auth.resolve({ request, db, params })) ?? null
}

async function verifyPermission<TParams extends VoyantNextParams>(
  config: VoyantNextConfig<TParams>,
  request: Request,
  db: VoyantDb,
  params: TParams,
  auth: VoyantNextRequestAuthContext | null,
  permission: VoyantPermission,
): Promise<Response | null> {
  if (auth?.isInternalRequest) {
    return null
  }

  if (hasScope(auth?.scopes, permission)) {
    return null
  }

  if (!auth?.userId) {
    return unauthorized()
  }

  if (!config.auth?.hasPermission) {
    return serverError({ error: "No auth permission checker configured" })
  }

  const allowed = await config.auth.hasPermission({
    request,
    db,
    params,
    auth,
    permission,
  })

  return allowed ? null : forbidden()
}

function buildRoute<TParams extends VoyantNextParams>(
  config: VoyantNextConfig<TParams>,
  handler: VoyantNextHandler<TParams>,
  options?: {
    requireAuth?: boolean
    permission?: VoyantPermission
  },
): VoyantNextRouteHandler<TParams> {
  return async (request, input) => {
    const params = await resolveParams(input)
    const db = await resolveDb(config, request, params)
    const auth = await resolveAuth(config, request, db, params)

    if (options?.requireAuth && !auth?.userId && !auth?.isInternalRequest) {
      return unauthorized()
    }

    if (options?.permission) {
      const denied = await verifyPermission(config, request, db, params, auth, options.permission)
      if (denied) {
        return denied
      }
    }

    return handler({
      request,
      params,
      db,
      auth,
    })
  }
}

export function createVoyantNextRoute<TParams extends VoyantNextParams>(
  config: VoyantNextConfig<TParams>,
) {
  return {
    public(handler: VoyantNextHandler<TParams>): VoyantNextRouteHandler<TParams> {
      return buildRoute(config, handler)
    },

    protected(handler: VoyantNextHandler<TParams>): VoyantNextRouteHandler<TParams> {
      return buildRoute(config, handler, { requireAuth: true })
    },

    withPermission(
      permission: VoyantPermission,
      handler: VoyantNextHandler<TParams>,
    ): VoyantNextRouteHandler<TParams> {
      return buildRoute(config, handler, {
        requireAuth: true,
        permission,
      })
    },
  }
}
