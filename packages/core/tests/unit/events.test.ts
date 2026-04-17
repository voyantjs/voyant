import { describe, expect, it, vi } from "vitest"

import { createEventBus } from "../../src/events.js"

describe("createEventBus", () => {
  it("delivers emitted events to subscribers", async () => {
    const bus = createEventBus()
    const handler = vi.fn()
    bus.subscribe("booking.created", handler)

    await bus.emit("booking.created", { id: "book_1" })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "booking.created",
        data: { id: "book_1" },
        emittedAt: expect.any(String),
      }),
    )
  })

  it("delivers to multiple subscribers for the same event", async () => {
    const bus = createEventBus()
    const a = vi.fn()
    const b = vi.fn()
    bus.subscribe("quote.sent", a)
    bus.subscribe("quote.sent", b)

    await bus.emit("quote.sent", { id: "q1" })

    expect(a).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "quote.sent",
        data: { id: "q1" },
      }),
    )
    expect(b).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "quote.sent",
        data: { id: "q1" },
      }),
    )
  })

  it("includes metadata in the delivered envelope when provided", async () => {
    const bus = createEventBus()
    const handler = vi.fn()
    bus.subscribe("invoice.settled", handler)

    await bus.emit(
      "invoice.settled",
      { id: "inv_1" },
      { category: "domain", source: "service", correlationId: "corr_123" },
    )

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "invoice.settled",
        data: { id: "inv_1" },
        metadata: {
          category: "domain",
          source: "service",
          correlationId: "corr_123",
        },
      }),
    )
  })

  it("does nothing when no subscribers are registered", async () => {
    const bus = createEventBus()
    await expect(bus.emit("unknown.event", {})).resolves.toBeUndefined()
  })

  it("returns an unsubscribe handle that removes the handler", async () => {
    const bus = createEventBus()
    const handler = vi.fn()
    const sub = bus.subscribe("x", handler)
    sub.unsubscribe()

    await bus.emit("x", {})

    expect(handler).not.toHaveBeenCalled()
  })

  it("continues delivering to later subscribers after one throws", async () => {
    const bus = createEventBus()
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const good = vi.fn()
    bus.subscribe("x", () => {
      throw new Error("boom")
    })
    bus.subscribe("x", good)

    await bus.emit("x", {})

    expect(good).toHaveBeenCalledOnce()
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it("awaits async handlers sequentially", async () => {
    const bus = createEventBus()
    const order: number[] = []
    bus.subscribe("x", async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      order.push(1)
    })
    bus.subscribe("x", () => {
      order.push(2)
    })

    await bus.emit("x", {})

    expect(order).toEqual([1, 2])
  })
})
