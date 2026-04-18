import { describe, expect, it, vi } from "vitest"

import { createEventBus } from "../../src/events.js"
import { defineLink } from "../../src/links.js"
import type { Extension, Module } from "../../src/module.js"
import type { Subscriber } from "../../src/plugin.js"
import { definePlugin, registerPlugins } from "../../src/plugin.js"

const modA: Module = { name: "modA" }
const modB: Module = { name: "modB" }
const extA: Extension = { name: "ext-a", module: "modA" }

describe("definePlugin", () => {
  it("returns the plugin unchanged", () => {
    const plugin = definePlugin({ name: "test", modules: [modA] })
    expect(plugin.name).toBe("test")
    expect(plugin.modules).toEqual([modA])
  })
})

describe("registerPlugins", () => {
  it("returns empty collections when no plugins are provided", () => {
    const result = registerPlugins([])
    expect(result.modules).toEqual([])
    expect(result.extensions).toEqual([])
    expect(result.links).toEqual([])
    expect(result.subscribers).toEqual([])
    expect(result.subscriptions).toEqual([])
  })

  it("flattens modules from all plugins in order", () => {
    const p1 = definePlugin({ name: "p1", modules: [modA] })
    const p2 = definePlugin({ name: "p2", modules: [modB] })
    const result = registerPlugins([p1, p2])
    expect(result.modules).toEqual([modA, modB])
  })

  it("flattens extensions from all plugins", () => {
    const p1 = definePlugin({ name: "p1", extensions: [extA] })
    const result = registerPlugins([p1])
    expect(result.extensions).toEqual([extA])
  })

  it("flattens link definitions from all plugins", () => {
    const linkDef = defineLink(
      { module: "modA", entity: "a", table: "a" },
      { module: "modB", entity: "b", table: "b" },
    )
    const p1 = definePlugin({ name: "p1", links: [linkDef] })
    const result = registerPlugins([p1])
    expect(result.links).toEqual([linkDef])
  })

  it("collects subscribers without wiring them when no event bus is passed", () => {
    const handler = vi.fn()
    const sub: Subscriber = { event: "booking.created", handler }
    const p1 = definePlugin({ name: "p1", subscribers: [sub] })
    const result = registerPlugins([p1])
    expect(result.subscribers).toEqual([sub])
    expect(result.subscriptions).toEqual([])
  })

  it("attaches subscribers to the event bus when provided", async () => {
    const handler = vi.fn()
    const bus = createEventBus()
    const p1 = definePlugin({
      name: "p1",
      subscribers: [{ event: "booking.created", handler }],
    })
    const result = registerPlugins([p1], { eventBus: bus })
    expect(result.subscriptions).toHaveLength(1)

    await bus.emit("booking.created", { id: "b1" })
    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "booking.created",
        data: { id: "b1" },
      }),
    )
  })

  it("subscriptions can be unsubscribed", async () => {
    const handler = vi.fn()
    const bus = createEventBus()
    const p1 = definePlugin({
      name: "p1",
      subscribers: [{ event: "x", handler }],
    })
    const result = registerPlugins([p1], { eventBus: bus })
    for (const sub of result.subscriptions) sub.unsubscribe()
    await bus.emit("x", null)
    expect(handler).not.toHaveBeenCalled()
  })

  it("throws when two plugins declare the same name", () => {
    const p1 = definePlugin({ name: "dup" })
    const p2 = definePlugin({ name: "dup" })
    expect(() => registerPlugins([p1, p2])).toThrow(/Duplicate plugin name/)
  })

  it("preserves insertion order across modules/extensions/subscribers", () => {
    const m1: Module = { name: "m1" }
    const m2: Module = { name: "m2" }
    const m3: Module = { name: "m3" }
    const p1 = definePlugin({ name: "p1", modules: [m1, m2] })
    const p2 = definePlugin({ name: "p2", modules: [m3] })
    const result = registerPlugins([p1, p2])
    expect(result.modules.map((m) => m.name)).toEqual(["m1", "m2", "m3"])
  })

  it("handles plugins that contribute nothing", () => {
    const p1 = definePlugin({ name: "empty" })
    const result = registerPlugins([p1])
    expect(result.modules).toEqual([])
    expect(result.extensions).toEqual([])
  })

  it("wires multiple subscribers for the same event", async () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    const bus = createEventBus()
    const p1 = definePlugin({
      name: "p1",
      subscribers: [{ event: "e", handler: h1 }],
    })
    const p2 = definePlugin({
      name: "p2",
      subscribers: [{ event: "e", handler: h2 }],
    })
    registerPlugins([p1, p2], { eventBus: bus })
    await bus.emit("e", "hi")
    expect(h1).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "e",
        data: "hi",
      }),
    )
    expect(h2).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "e",
        data: "hi",
      }),
    )
  })
})
