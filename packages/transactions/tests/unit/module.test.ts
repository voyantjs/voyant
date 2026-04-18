import { createContainer, createEventBus } from "@voyantjs/core"
import { describe, expect, it } from "vitest"

import {
  createTransactionsHonoModule,
  TRANSACTIONS_ROUTE_RUNTIME_CONTAINER_KEY,
} from "../../src/index.js"

describe("createTransactionsHonoModule.bootstrap", () => {
  it("registers the shared transactions route runtime once", async () => {
    const module = createTransactionsHonoModule()
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
    }>(TRANSACTIONS_ROUTE_RUNTIME_CONTAINER_KEY)

    expect(runtime.getKmsProvider).toBeTypeOf("function")
  })
})
