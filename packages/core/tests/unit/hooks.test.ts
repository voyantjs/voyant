import { afterEach, describe, expect, it, vi } from "vitest"

import { hooks } from "../../src/hooks.js"

describe("HookSystem", () => {
  const handlers: Array<{ event: string; handler: (...args: unknown[]) => void }> = []

  function track(event: string, handler: (...args: unknown[]) => void) {
    handlers.push({ event, handler })
    hooks.on(event, handler)
  }

  afterEach(() => {
    for (const { event, handler } of handlers) {
      hooks.off(event, handler)
    }
    handlers.length = 0
  })

  describe("on / emit", () => {
    it("calls a registered handler when event is emitted", async () => {
      const handler = vi.fn()
      track("test.event", handler)

      await hooks.emit("test.event", "arg1", 42)

      expect(handler).toHaveBeenCalledOnce()
      expect(handler).toHaveBeenCalledWith("arg1", 42)
    })

    it("calls multiple handlers for the same event", async () => {
      const h1 = vi.fn()
      const h2 = vi.fn()
      track("multi.event", h1)
      track("multi.event", h2)

      await hooks.emit("multi.event")

      expect(h1).toHaveBeenCalledOnce()
      expect(h2).toHaveBeenCalledOnce()
    })

    it("does not call handlers for unrelated events", async () => {
      const handler = vi.fn()
      track("event.a", handler)

      await hooks.emit("event.b")

      expect(handler).not.toHaveBeenCalled()
    })

    it("awaits async handlers sequentially", async () => {
      const order: number[] = []

      track("async.event", async () => {
        await new Promise((r) => setTimeout(r, 10))
        order.push(1)
      })
      track("async.event", () => {
        order.push(2)
      })

      await hooks.emit("async.event")

      expect(order).toEqual([1, 2])
    })
  })

  describe("off", () => {
    it("removes a handler so it no longer fires", async () => {
      const handler = vi.fn()
      hooks.on("off.event", handler)
      hooks.off("off.event", handler)

      await hooks.emit("off.event")

      expect(handler).not.toHaveBeenCalled()
    })

    it("only removes the specified handler", async () => {
      const kept = vi.fn()
      const removed = vi.fn()
      track("partial.off", kept)
      hooks.on("partial.off", removed)
      hooks.off("partial.off", removed)

      await hooks.emit("partial.off")

      expect(kept).toHaveBeenCalledOnce()
      expect(removed).not.toHaveBeenCalled()
    })

    it("is a no-op for an unregistered event", () => {
      const handler = vi.fn()
      expect(() => hooks.off("nonexistent", handler)).not.toThrow()
    })
  })

  describe("emit", () => {
    it("is a no-op when no handlers are registered", async () => {
      await expect(hooks.emit("no.handlers")).resolves.toBeUndefined()
    })

    it("passes all arguments to handlers", async () => {
      const handler = vi.fn()
      track("args.event", handler)

      await hooks.emit("args.event", "a", "b", "c")

      expect(handler).toHaveBeenCalledWith("a", "b", "c")
    })
  })
})
