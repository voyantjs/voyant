import { describe, expect, it } from "vitest"

import { createContainer } from "../../src/container.js"

describe("createContainer", () => {
  it("registers and resolves a service by name", () => {
    const container = createContainer()
    const service = { greet: () => "hi" }

    container.register("greeter", service)

    expect(container.resolve<typeof service>("greeter")).toBe(service)
  })

  it("throws when resolving an unregistered service", () => {
    const container = createContainer()

    expect(() => container.resolve("missing")).toThrow(
      'Service "missing" is not registered in the container',
    )
  })

  it("returns whether a service is registered via has()", () => {
    const container = createContainer()

    expect(container.has("x")).toBe(false)
    container.register("x", {})
    expect(container.has("x")).toBe(true)
  })

  it("overwrites an existing registration", () => {
    const container = createContainer()
    container.register("svc", { v: 1 })
    container.register("svc", { v: 2 })

    expect(container.resolve<{ v: number }>("svc").v).toBe(2)
  })

  it("supports storing functions as services", () => {
    const container = createContainer()
    const fn = () => 42
    container.register("fn", fn)

    expect(container.resolve<() => number>("fn")()).toBe(42)
  })

  it("isolates services between container instances", () => {
    const a = createContainer()
    const b = createContainer()
    a.register("x", "from-a")

    expect(a.resolve("x")).toBe("from-a")
    expect(b.has("x")).toBe(false)
  })
})
