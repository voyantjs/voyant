import { createKmsProviderFromEnv, type KmsProvider } from "@voyantjs/utils"

import type { KmsBindings } from "./routes-shared.js"

export const BOOKING_ROUTE_RUNTIME_CONTAINER_KEY = "runtime.bookings.routes"

export interface BookingRouteRuntime {
  getKmsProvider(): KmsProvider
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
  }
}

export function buildBookingRouteRuntime(bindings: KmsBindings): BookingRouteRuntime {
  const runtimeEnv = buildRuntimeEnv(bindings)

  return {
    getKmsProvider() {
      return createKmsProviderFromEnv(runtimeEnv)
    },
  }
}
