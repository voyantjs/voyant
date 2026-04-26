import { afterEach, describe, expect, it } from "vitest"

import { MockCharterAdapter } from "../../src/adapters/mock.js"
import {
  clearCharterAdapters,
  hasCharterAdapter,
  listCharterAdapters,
  registerCharterAdapter,
  resolveCharterAdapter,
  unregisterCharterAdapter,
} from "../../src/adapters/registry.js"

afterEach(() => clearCharterAdapters())

describe("charter adapter registry", () => {
  it("registers, resolves, lists, and unregisters by name", () => {
    const adapter = new MockCharterAdapter({ name: "voyant-connect" })
    registerCharterAdapter(adapter)
    expect(hasCharterAdapter("voyant-connect")).toBe(true)
    expect(resolveCharterAdapter("voyant-connect")).toBe(adapter)
    expect(listCharterAdapters()).toEqual([adapter])
    expect(unregisterCharterAdapter("voyant-connect")).toBe(true)
    expect(hasCharterAdapter("voyant-connect")).toBe(false)
  })

  it("throws when registering an adapter twice with the same name", () => {
    registerCharterAdapter(new MockCharterAdapter({ name: "twin" }))
    expect(() => registerCharterAdapter(new MockCharterAdapter({ name: "twin" }))).toThrow(
      /already registered/,
    )
  })

  it("throws when registering an adapter with an empty name", () => {
    expect(() => registerCharterAdapter(new MockCharterAdapter({ name: "" }))).toThrow(
      /non-empty name/,
    )
  })

  it("returns undefined for unknown providers and false for unregister-of-missing", () => {
    expect(resolveCharterAdapter("nope")).toBeUndefined()
    expect(unregisterCharterAdapter("nope")).toBe(false)
  })

  it("clearCharterAdapters drops everything", () => {
    registerCharterAdapter(new MockCharterAdapter({ name: "a" }))
    registerCharterAdapter(new MockCharterAdapter({ name: "b" }))
    expect(listCharterAdapters()).toHaveLength(2)
    clearCharterAdapters()
    expect(listCharterAdapters()).toHaveLength(0)
  })
})
