import { createContainer, createEventBus } from "@voyantjs/core"
import { describe, expect, it } from "vitest"

import { BOOKING_ROUTE_RUNTIME_CONTAINER_KEY, createBookingsHonoModule } from "../../src/index.js"

describe("createBookingsHonoModule.bootstrap", () => {
  it("registers the shared bookings route runtime once", async () => {
    const module = createBookingsHonoModule()
    const container = createContainer()

    await module.module.bootstrap?.({
      bindings: {
        KMS_PROVIDER: "env",
        KMS_LOCAL_KEY: "test-key",
      },
      container,
      eventBus: createEventBus(),
    })

    const runtime = container.resolve<{
      getKmsProvider: () => unknown
    }>(BOOKING_ROUTE_RUNTIME_CONTAINER_KEY)

    expect(runtime.getKmsProvider).toBeTypeOf("function")
  })
})
