import { createContainer, createEventBus } from "@voyantjs/core"
import { describe, expect, it, vi } from "vitest"

import {
  CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY,
  createCustomerPortalHonoModule,
} from "../../src/index.js"

describe("createCustomerPortalHonoModule.bootstrap", () => {
  it("registers the shared customer portal runtime with document URLs and KMS access", async () => {
    const resolveDocumentDownloadUrl = vi.fn(
      (_bindings, storageKey: string) => `signed:${storageKey}`,
    )
    const container = createContainer()
    const module = createCustomerPortalHonoModule({ resolveDocumentDownloadUrl }).module

    await module.bootstrap?.({
      bindings: {
        DOCUMENTS_BUCKET: "documents",
        KMS_PROVIDER: "env",
        KMS_LOCAL_KEY: "test-key",
      },
      container,
      eventBus: createEventBus(),
    })

    const runtime = container.resolve(CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY)

    expect(runtime?.getOptionalKmsProvider).toBeTypeOf("function")
    expect(runtime?.resolveDocumentDownloadUrl).toBeTypeOf("function")
    expect(runtime?.resolveDocumentDownloadUrl?.("doc_123")).toBe("signed:doc_123")
    expect(resolveDocumentDownloadUrl).toHaveBeenCalledWith(
      {
        DOCUMENTS_BUCKET: "documents",
        KMS_PROVIDER: "env",
        KMS_LOCAL_KEY: "test-key",
      },
      "doc_123",
    )
  })
})
