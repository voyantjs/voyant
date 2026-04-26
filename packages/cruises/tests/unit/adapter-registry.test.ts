import { afterEach, describe, expect, it } from "vitest"

import { MockCruiseAdapter } from "../../src/adapters/mock.js"
import {
  clearCruiseAdapters,
  hasCruiseAdapter,
  listCruiseAdapters,
  registerCruiseAdapter,
  resolveCruiseAdapter,
  unregisterCruiseAdapter,
} from "../../src/adapters/registry.js"

afterEach(() => clearCruiseAdapters())

describe("registerCruiseAdapter", () => {
  it("registers a single adapter and resolves it by name", () => {
    const adapter = new MockCruiseAdapter({ name: "mock-a" })
    registerCruiseAdapter(adapter)
    expect(resolveCruiseAdapter("mock-a")).toBe(adapter)
    expect(hasCruiseAdapter("mock-a")).toBe(true)
  })

  it("supports multiple adapters with distinct names", () => {
    registerCruiseAdapter(new MockCruiseAdapter({ name: "alpha" }))
    registerCruiseAdapter(new MockCruiseAdapter({ name: "beta" }))
    expect(
      listCruiseAdapters()
        .map((a) => a.name)
        .sort(),
    ).toEqual(["alpha", "beta"])
  })

  it("throws on duplicate registration", () => {
    registerCruiseAdapter(new MockCruiseAdapter({ name: "dup" }))
    expect(() => registerCruiseAdapter(new MockCruiseAdapter({ name: "dup" }))).toThrow(
      /already registered/,
    )
  })

  it("throws on adapter with empty name", () => {
    expect(() => registerCruiseAdapter(new MockCruiseAdapter({ name: "" }))).toThrow(
      /non-empty name/,
    )
  })
})

describe("unregisterCruiseAdapter", () => {
  it("removes a registered adapter", () => {
    registerCruiseAdapter(new MockCruiseAdapter({ name: "removable" }))
    expect(unregisterCruiseAdapter("removable")).toBe(true)
    expect(hasCruiseAdapter("removable")).toBe(false)
  })

  it("returns false for unknown names", () => {
    expect(unregisterCruiseAdapter("never-registered")).toBe(false)
  })
})

describe("clearCruiseAdapters", () => {
  it("removes all registered adapters", () => {
    registerCruiseAdapter(new MockCruiseAdapter({ name: "a" }))
    registerCruiseAdapter(new MockCruiseAdapter({ name: "b" }))
    clearCruiseAdapters()
    expect(listCruiseAdapters()).toEqual([])
  })
})

describe("resolveCruiseAdapter", () => {
  it("returns undefined for unknown providers", () => {
    expect(resolveCruiseAdapter("not-here")).toBeUndefined()
  })
})
