import { describe, expect, it, vi } from "vitest"

import { createPayloadSyncRuntime } from "../../src/runtime.js"
import type { PayloadFetch } from "../../src/types.js"

const baseOptions = {
  apiUrl: "https://cms.example.com/api",
  apiKey: "test-key",
  collection: "products",
}

describe("createPayloadSyncRuntime", () => {
  it("builds the default client, logger, mapper, and event names", () => {
    const fetchMock = vi.fn<PayloadFetch>()
    const runtime = createPayloadSyncRuntime({
      ...baseOptions,
      fetch: fetchMock,
    })

    expect(runtime.client).toBeDefined()
    expect(runtime.logger).toBe(console)
    expect(runtime.eventNames).toEqual({
      created: "product.created",
      updated: "product.updated",
      deleted: "product.deleted",
    })
    expect(runtime.mapEvent({ id: "prod_1", name: "Tour A" })).toEqual({ name: "Tour A" })
  })

  it("honors custom logger, mapper, and event names", () => {
    const fetchMock = vi.fn<PayloadFetch>()
    const logger = { error: vi.fn(), info: vi.fn() }
    const mapEvent = vi.fn().mockReturnValue({
      title: "Custom Tour",
      _syncedAt: "2024-01-01",
    })

    const runtime = createPayloadSyncRuntime({
      ...baseOptions,
      fetch: fetchMock,
      logger,
      mapEvent,
      events: {
        created: "departure.created",
        updated: "departure.updated",
        deleted: "departure.deleted",
      },
    })

    expect(runtime.logger).toBe(logger)
    expect(runtime.mapEvent).toBe(mapEvent)
    expect(runtime.eventNames).toEqual({
      created: "departure.created",
      updated: "departure.updated",
      deleted: "departure.deleted",
    })
  })
})
