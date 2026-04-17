import { createContainer } from "@voyantjs/core"
import { describe, expect, it, vi } from "vitest"

import {
  createCustomerPortalHonoModule,
  CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY,
} from "../../src/index.js"

describe("createCustomerPortalHonoModule", () => {
  it("registers public customer portal route runtime during bootstrap", () => {
    const resolveDocumentDownloadUrl = vi.fn((_bindings, storageKey: string) => `signed:${storageKey}`)
    const container = createContainer()
    const bindings = { DOCUMENTS_BUCKET: "documents" }

    const module = createCustomerPortalHonoModule({
      resolveDocumentDownloadUrl,
    }).module

    module.bootstrap?.({ bindings, container })

    const runtime = container.resolve(CUSTOMER_PORTAL_ROUTE_RUNTIME_CONTAINER_KEY)

    expect(runtime?.resolveDocumentDownloadUrl).toBeTypeOf("function")
    expect(runtime?.resolveDocumentDownloadUrl?.("doc_123")).toBe("signed:doc_123")
    expect(resolveDocumentDownloadUrl).toHaveBeenCalledWith(bindings, "doc_123")
  })
})
