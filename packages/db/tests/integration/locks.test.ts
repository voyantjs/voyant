import { afterAll, describe, expect, it } from "vitest"

import { createPostgresAdvisoryLockManager } from "../../src/runtime/locks.js"
import { createTestDb } from "../../src/test-utils.js"

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
let DB_AVAILABLE = false

if (TEST_DATABASE_URL) {
  try {
    const probe = createTestDb()
    await probe.execute(/* sql */ `SELECT 1`)
    DB_AVAILABLE = true
  } catch {
    DB_AVAILABLE = false
  }
}

describe.skipIf(!DB_AVAILABLE || !TEST_DATABASE_URL)("createPostgresAdvisoryLockManager", () => {
  const firstManager = createPostgresAdvisoryLockManager(TEST_DATABASE_URL!, {
    namespace: "test",
  })
  const secondManager = createPostgresAdvisoryLockManager(TEST_DATABASE_URL!, {
    namespace: "test",
  })

  afterAll(async () => {
    await firstManager.dispose?.()
    await secondManager.dispose?.()
  })

  it("skips a concurrent run for the same key and allows it after release", async () => {
    let releaseFirstRun!: () => void

    const firstRun = firstManager.runExclusive("notifications:due-reminders", async () => {
      await new Promise<void>((resolve) => {
        releaseFirstRun = resolve
      })
      return "first"
    })

    await Promise.resolve()

    await expect(
      secondManager.runExclusive("notifications:due-reminders", async () => "second"),
    ).resolves.toEqual({ executed: false })

    releaseFirstRun()

    await expect(firstRun).resolves.toEqual({
      executed: true,
      value: "first",
    })

    await expect(
      secondManager.runExclusive("notifications:due-reminders", async () => "third"),
    ).resolves.toEqual({
      executed: true,
      value: "third",
    })
  })
})
