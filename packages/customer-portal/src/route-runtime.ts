import { createKmsProviderFromEnv, type KmsProvider } from "@voyantjs/utils"

export const CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY = "runtime.customer-portal.routes"

type KmsBindings = Record<string, unknown>

export interface CustomerPortalRouteRuntime {
  getOptionalKmsProvider(): KmsProvider | null
}

function buildRuntimeEnv(bindings: KmsBindings): Record<string, string | undefined> {
  const processEnv =
    (
      globalThis as typeof globalThis & {
        process?: { env?: Record<string, string | undefined> }
      }
    ).process?.env ?? {}

  return {
    ...processEnv,
    ...(bindings ?? {}),
  } as Record<string, string | undefined>
}

export function buildCustomerPortalRouteRuntime(bindings: KmsBindings): CustomerPortalRouteRuntime {
  const runtimeEnv = buildRuntimeEnv(bindings)

  return {
    getOptionalKmsProvider() {
      try {
        return createKmsProviderFromEnv(runtimeEnv)
      } catch {
        return null
      }
    },
  }
}
