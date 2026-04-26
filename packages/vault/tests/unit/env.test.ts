import { describe, expect, it } from "vitest"

import { createEnvVaultProvider } from "../../src/providers/env.js"

describe("createEnvVaultProvider", () => {
  it("reads keys directly from the env by default", async () => {
    const provider = createEnvVaultProvider({
      env: { SMARTBILL_API_KEY: "k_test" },
    })
    const secret = await provider.getSecret("any", "SMARTBILL_API_KEY")
    expect(secret).toEqual({ key: "SMARTBILL_API_KEY", value: "k_test", version: 1 })
  })

  it("returns null for unset or empty values", async () => {
    const provider = createEnvVaultProvider({
      env: { EMPTY: "", NUMERIC: 42 },
    })
    expect(await provider.getSecret("any", "MISSING")).toBeNull()
    expect(await provider.getSecret("any", "EMPTY")).toBeNull()
    expect(await provider.getSecret("any", "NUMERIC")).toBeNull()
  })

  it("supports a custom slug-aware key resolver", async () => {
    const provider = createEnvVaultProvider({
      env: { SMARTBILL__API_KEY: "k_test" },
      resolveEnvKey: (slug, key) => `${slug.toUpperCase()}__${key.toUpperCase()}`,
    })
    expect(await provider.getSecret("smartbill", "api_key")).toEqual({
      key: "api_key",
      value: "k_test",
      version: 1,
    })
  })
})
