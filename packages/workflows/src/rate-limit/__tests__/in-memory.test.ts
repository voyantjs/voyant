import { describe, expect, it } from "vitest"
import { createInMemoryRateLimiter, durationToMs, RateLimitExceededError } from "../index.js"

// Deterministic clock + delay for the limiter under test.
function fakeClock(start = 0) {
  let t = start
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms
    },
  }
}

function makeLimiter(clock: { now: () => number }) {
  // delay() just advances the clock and resolves. Acquire's re-check
  // loop will observe the new time on the next refill() call.
  return createInMemoryRateLimiter({
    now: clock.now,
    delay: async (ms) => {
      ;(clock as { advance?: (ms: number) => void }).advance?.(ms)
    },
  })
}

describe("createInMemoryRateLimiter", () => {
  it("admits calls under the limit without blocking", async () => {
    const clock = fakeClock()
    const lim = makeLimiter(clock)

    await lim.acquire({
      key: "k",
      limit: 3,
      units: 1,
      windowMs: 1000,
      onLimit: "fail",
    })
    await lim.acquire({
      key: "k",
      limit: 3,
      units: 1,
      windowMs: 1000,
      onLimit: "fail",
    })
    // No throw → both admitted immediately.
  })

  it("throws RATE_LIMITED when onLimit='fail' and bucket is empty", async () => {
    const clock = fakeClock()
    const lim = makeLimiter(clock)
    // Spend the whole bucket (limit=2, units=2).
    await lim.acquire({ key: "k", limit: 2, units: 2, windowMs: 1000, onLimit: "fail" })

    await expect(
      lim.acquire({ key: "k", limit: 2, units: 1, windowMs: 1000, onLimit: "fail" }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" })
  })

  it("reports a retryAfterMs roughly matching the refill time", async () => {
    const clock = fakeClock()
    const lim = makeLimiter(clock)
    await lim.acquire({ key: "k", limit: 2, units: 2, windowMs: 1000, onLimit: "fail" })
    try {
      await lim.acquire({ key: "k", limit: 2, units: 1, windowMs: 1000, onLimit: "fail" })
      expect.unreachable("should have thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitExceededError)
      const e = err as RateLimitExceededError
      // 1 unit @ 2 units/s = 500ms.
      expect(e.retryAfterMs).toBeGreaterThanOrEqual(500)
      expect(e.retryAfterMs).toBeLessThanOrEqual(600)
    }
  })

  it("queues when onLimit='queue' until capacity refills", async () => {
    const clock = fakeClock()
    const lim = makeLimiter(clock)
    const startedAt = clock.now()
    // limit=2, units=3 over three acquires: #1+#2 immediate, #3 waits.
    await lim.acquire({ key: "k", limit: 2, units: 1, windowMs: 1000, onLimit: "queue" })
    await lim.acquire({ key: "k", limit: 2, units: 1, windowMs: 1000, onLimit: "queue" })
    await lim.acquire({ key: "k", limit: 2, units: 1, windowMs: 1000, onLimit: "queue" })
    // 1 token @ 2/sec → ~500ms delay for the third.
    expect(clock.now() - startedAt).toBeGreaterThanOrEqual(500)
  })

  it("scopes buckets by key", async () => {
    const clock = fakeClock()
    const lim = makeLimiter(clock)
    await lim.acquire({ key: "a", limit: 1, units: 1, windowMs: 1000, onLimit: "fail" })
    // Different key should not be rate-limited.
    await lim.acquire({ key: "b", limit: 1, units: 1, windowMs: 1000, onLimit: "fail" })
    // Same key again → fails.
    await expect(
      lim.acquire({ key: "a", limit: 1, units: 1, windowMs: 1000, onLimit: "fail" }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" })
  })

  it("refills tokens over time", async () => {
    const clock = fakeClock()
    const lim = makeLimiter(clock)
    await lim.acquire({ key: "k", limit: 1, units: 1, windowMs: 1000, onLimit: "fail" })
    // Without advancing: second call would fail.
    clock.advance(1000)
    // After a full window: bucket refilled to cap.
    await lim.acquire({ key: "k", limit: 1, units: 1, windowMs: 1000, onLimit: "fail" })
  })

  it("rejects units > limit synchronously (would hang under queue)", async () => {
    const clock = fakeClock()
    const lim = makeLimiter(clock)
    await expect(
      lim.acquire({ key: "k", limit: 2, units: 3, windowMs: 1000, onLimit: "queue" }),
    ).rejects.toThrow(/units \(3\) > limit \(2\)/)
  })

  it("aborts a queued acquire when the abort signal fires", async () => {
    const clock = fakeClock()
    // Real delay this time — the fake clock can't observe AbortSignal
    // events without running the real setTimeout path.
    const lim = createInMemoryRateLimiter({ now: clock.now })
    await lim.acquire({ key: "k", limit: 1, units: 1, windowMs: 60_000, onLimit: "fail" })
    const ctrl = new AbortController()
    const p = lim.acquire({
      key: "k",
      limit: 1,
      units: 1,
      windowMs: 60_000,
      onLimit: "queue",
      signal: ctrl.signal,
    })
    ctrl.abort(new Error("stopping"))
    await expect(p).rejects.toThrow(/stopping/)
  })
})

describe("durationToMs", () => {
  it.each([
    [1000, 1000],
    ["500ms", 500],
    ["2s", 2_000],
    ["3m", 180_000],
    ["1h", 3_600_000],
    ["1d", 86_400_000],
    ["1w", 604_800_000],
  ])("converts %s → %d ms", (input, expected) => {
    expect(durationToMs(input as number | `${number}s`)).toBe(expected)
  })

  it("rejects invalid durations", () => {
    // @ts-expect-error — intentionally bad value at runtime.
    expect(() => durationToMs("forever")).toThrow(/invalid duration/)
  })
})
