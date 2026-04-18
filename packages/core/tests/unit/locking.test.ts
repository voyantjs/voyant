import { describe, expect, it } from "vitest"

import { createInMemoryExecutionLockManager } from "../../src/locking.js"

describe("createInMemoryExecutionLockManager", () => {
  it("skips a concurrent run for the same key", async () => {
    const manager = createInMemoryExecutionLockManager()
    let releaseFirstRun!: () => void

    const firstRun = manager.runExclusive("notifications:due-reminders", async () => {
      await new Promise<void>((resolve) => {
        releaseFirstRun = resolve
      })
      return "first"
    })

    await Promise.resolve()

    const secondRun = await manager.runExclusive("notifications:due-reminders", async () => {
      return "second"
    })

    expect(secondRun).toEqual({ executed: false })

    releaseFirstRun()

    await expect(firstRun).resolves.toEqual({
      executed: true,
      value: "first",
    })
  })

  it("allows different keys and reruns after release", async () => {
    const manager = createInMemoryExecutionLockManager()

    await expect(
      manager.runExclusive("notifications:due-reminders", async () => "first"),
    ).resolves.toEqual({
      executed: true,
      value: "first",
    })

    await expect(
      manager.runExclusive("notifications:due-reminders", async () => "second"),
    ).resolves.toEqual({
      executed: true,
      value: "second",
    })

    await expect(
      manager.runExclusive("bookings:expire-stale-holds", async () => "other"),
    ).resolves.toEqual({
      executed: true,
      value: "other",
    })
  })
})
