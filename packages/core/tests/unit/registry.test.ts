import { afterEach, describe, expect, it, vi } from "vitest"

import { hooks } from "../../src/hooks.js"
import { createRegistry } from "../../src/registry.js"

describe("createRegistry", () => {
  const cleanups: Array<{ event: string; handler: (...args: unknown[]) => void }> = []

  afterEach(() => {
    for (const { event, handler } of cleanups) {
      hooks.off(event, handler)
    }
    cleanups.length = 0
  })

  it("returns empty modules and extensions by default", () => {
    const registry = createRegistry()

    expect(registry.modules).toEqual([])
    expect(registry.extensions).toEqual([])
  })

  it("returns the provided modules", () => {
    const mod = { name: "test-module" }
    const registry = createRegistry({ modules: [mod] })

    expect(registry.modules).toEqual([mod])
  })

  it("returns the provided extensions", () => {
    const ext = { name: "test-ext", module: "test-module" }
    const registry = createRegistry({ extensions: [ext] })

    expect(registry.extensions).toEqual([ext])
  })

  it("registers module hooks on the global hook system", async () => {
    const handler = vi.fn()
    cleanups.push({ event: "mod.beforeCreate", handler })

    createRegistry({
      modules: [{ name: "mod", hooks: { "mod.beforeCreate": handler } }],
    })

    await hooks.emit("mod.beforeCreate", { id: "1" })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith({ id: "1" })
  })

  it("registers extension hooks on the global hook system", async () => {
    const handler = vi.fn()
    cleanups.push({ event: "suppliers.afterUpdate", handler })

    createRegistry({
      extensions: [
        {
          name: "supplier-audit",
          module: "suppliers",
          hooks: { "suppliers.afterUpdate": handler },
        },
      ],
    })

    await hooks.emit("suppliers.afterUpdate", { id: "2" })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith({ id: "2" })
  })

  it("handles modules without hooks", () => {
    expect(() => createRegistry({ modules: [{ name: "bare" }] })).not.toThrow()
  })

  it("handles extensions without hooks", () => {
    expect(() =>
      createRegistry({ extensions: [{ name: "bare-ext", module: "some" }] }),
    ).not.toThrow()
  })

  it("registers hooks from both modules and extensions", async () => {
    const modHandler = vi.fn()
    const extHandler = vi.fn()
    cleanups.push({ event: "crm.beforeCreate", handler: modHandler })
    cleanups.push({ event: "crm.afterCreate", handler: extHandler })

    createRegistry({
      modules: [{ name: "crm", hooks: { "crm.beforeCreate": modHandler } }],
      extensions: [
        {
          name: "crm-notify",
          module: "crm",
          hooks: { "crm.afterCreate": extHandler },
        },
      ],
    })

    await hooks.emit("crm.beforeCreate")
    await hooks.emit("crm.afterCreate")

    expect(modHandler).toHaveBeenCalledOnce()
    expect(extHandler).toHaveBeenCalledOnce()
  })
})
