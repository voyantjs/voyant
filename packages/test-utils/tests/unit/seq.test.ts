import { describe, expect, it } from "vitest"

import { createCounter, createNameFactory, createSequence } from "../../src/seq.js"

describe("createCounter", () => {
  it("starts at 1 on first call with default start", () => {
    const next = createCounter()
    expect(next()).toBe(1)
    expect(next()).toBe(2)
    expect(next()).toBe(3)
  })

  it("honors a custom start value", () => {
    const next = createCounter(10)
    expect(next()).toBe(11)
    expect(next()).toBe(12)
  })

  it("peek() returns the last value without incrementing", () => {
    const next = createCounter()
    next()
    next()
    expect(next.peek()).toBe(2)
    expect(next.peek()).toBe(2)
  })

  it("reset() restores the start value", () => {
    const next = createCounter(100)
    next()
    next()
    next.reset()
    expect(next.peek()).toBe(100)
    expect(next()).toBe(101)
  })

  it("produces independent counters per factory call", () => {
    const a = createCounter()
    const b = createCounter()
    a()
    a()
    b()
    expect(a.peek()).toBe(2)
    expect(b.peek()).toBe(1)
  })
})

describe("createSequence", () => {
  it("formats with a prefix and pads to the requested width", () => {
    const next = createSequence("BK-TEST", 6)
    expect(next()).toBe("BK-TEST-000001")
    expect(next()).toBe("BK-TEST-000002")
  })

  it("uses a default pad length of 4", () => {
    const next = createSequence("OFF")
    expect(next()).toBe("OFF-0001")
    expect(next()).toBe("OFF-0002")
  })

  it("does not truncate past the pad length", () => {
    const next = createSequence("ID", 2)
    for (let i = 0; i < 100; i++) next()
    expect(next()).toBe("ID-101")
  })

  it("reset() restarts the counter", () => {
    const next = createSequence("X", 3)
    next()
    next()
    next.reset()
    expect(next()).toBe("X-001")
  })

  it("peek() returns the current numeric value", () => {
    const next = createSequence("X", 3)
    next()
    next()
    next()
    expect(next.peek()).toBe(3)
  })
})

describe("createNameFactory", () => {
  it("appends an incrementing index to the base", () => {
    const name = createNameFactory("Alice")
    expect(name()).toBe("Alice 1")
    expect(name()).toBe("Alice 2")
    expect(name()).toBe("Alice 3")
  })

  it("produces independent counters per factory call", () => {
    const a = createNameFactory("A")
    const b = createNameFactory("B")
    a()
    a()
    b()
    expect(a()).toBe("A 3")
    expect(b()).toBe("B 2")
  })
})
