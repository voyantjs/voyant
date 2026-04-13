import { afterAll, describe, expect, it } from "vitest"

import { buildDescribeIf, DB_ENV_SET, describeIfDb, TEST_DATABASE_URL } from "../../src/db.js"

function buildDefaultTestDbUrl(port: string) {
  const url = new URL("postgres://localhost")
  url.port = port
  url.pathname = "/voyant_test"
  url.username = "test"
  url.password = "test"
  return url.toString()
}

describe("db helpers (unit)", () => {
  it("TEST_DATABASE_URL falls back to the compose default when env is unset", () => {
    if (!process.env.TEST_DATABASE_URL) {
      const port = process.env.TEST_DATABASE_PORT ?? "5436"
      expect(TEST_DATABASE_URL).toBe(buildDefaultTestDbUrl(port))
    } else {
      expect(TEST_DATABASE_URL).toBe(process.env.TEST_DATABASE_URL)
    }
  })

  it("DB_ENV_SET reflects TEST_DATABASE_URL env var", () => {
    expect(DB_ENV_SET).toBe(!!process.env.TEST_DATABASE_URL)
  })

  it("describeIfDb is a describe-like function", () => {
    expect(typeof describeIfDb).toBe("function")
  })

  it("buildDescribeIf returns a describe-like function for true", () => {
    expect(typeof buildDescribeIf(true)).toBe("function")
  })

  it("buildDescribeIf returns a describe-like function for false", () => {
    expect(typeof buildDescribeIf(false)).toBe("function")
  })
})

// Exercise the skipIf wrapping via actual nested describe blocks. We track
// execution via side effects and verify in an afterAll hook, which is
// guaranteed to run after all `it()` blocks in the file.
const executed = new Set<string>()

buildDescribeIf(true)("buildDescribeIf(true) runs its tests", () => {
  it("runs this body", () => {
    executed.add("enabled")
  })
})

buildDescribeIf(false)("buildDescribeIf(false) skips its tests", () => {
  it("is skipped and never executes", () => {
    executed.add("disabled")
    expect.fail("this body must not run")
  })
})

afterAll(() => {
  expect(executed.has("enabled")).toBe(true)
  expect(executed.has("disabled")).toBe(false)
})
