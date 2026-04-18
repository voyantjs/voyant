import { createContainer, createEventBus } from "@voyantjs/core"
import { describe, expect, it } from "vitest"

import {
  createCustomerPortalHonoModule,
  CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY,
} from "../../src/index.js"

describe("createCustomerPortalHonoModule.bootstrap", () => {
  it("registers the shared customer portal route runtime once", async () => {
    const module = createCustomerPortalHonoModule()
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
      getOptionalKmsProvider: () => unknown
    }>(CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY)

    expect(runtime.getOptionalKmsProvider).toBeTypeOf("function")
  })
})
