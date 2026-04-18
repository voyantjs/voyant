import { createContainer, createEventBus } from "@voyantjs/core"
import { describe, expect, it, vi } from "vitest"

import { createFinanceHonoModule, FINANCE_ROUTE_RUNTIME_CONTAINER_KEY } from "../../src/index.js"

describe("createFinanceHonoModule", () => {
  it("registers finance route runtime during bootstrap", () => {
    const generator = vi.fn()
    const poller = vi.fn()
    const eventBus = createEventBus()
    const resolveInvoiceDocumentGenerator = vi.fn(() => generator)
    const resolveInvoiceSettlementPollers = vi.fn(() => ({ netopia: poller }))
    const resolveEventBus = vi.fn(() => eventBus)
    const container = createContainer()
    const bindings = { NETOPIA_SIGNATURE: "sig" }

    const module = createFinanceHonoModule({
      resolveInvoiceDocumentGenerator,
      resolveInvoiceSettlementPollers,
      resolveEventBus,
    }).module

    module.bootstrap?.({ bindings, container })

    const runtime = container.resolve(FINANCE_ROUTE_RUNTIME_CONTAINER_KEY)

    expect(resolveInvoiceDocumentGenerator).toHaveBeenCalledTimes(1)
    expect(resolveInvoiceSettlementPollers).toHaveBeenCalledTimes(1)
    expect(resolveEventBus).toHaveBeenCalledTimes(1)
    expect(runtime?.invoiceDocumentGenerator).toBe(generator)
    expect(runtime?.invoiceSettlementPollers.netopia).toBe(poller)
    expect(runtime?.eventBus).toBe(eventBus)
  })
})
