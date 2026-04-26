import { describe, expect, it, vi } from "vitest"

import { createVoyantCloudVaultProvider } from "../../src/providers/voyant-cloud.js"

function makeFakeClient(behavior: "ok" | "throw") {
  const getSecret = vi.fn(async (vaultSlug: string, key: string) => {
    if (behavior === "throw") {
      throw new Error("nope")
    }
    return {
      key,
      value: `value-of-${vaultSlug}-${key}`,
      version: 7,
      updatedAt: "2026-04-26T00:00:00.000Z",
    }
  })
  return {
    getSecret,
    client: { vault: { getSecret } } as unknown as Parameters<
      typeof createVoyantCloudVaultProvider
    >[0]["client"],
  }
}

describe("createVoyantCloudVaultProvider", () => {
  it("delegates to vault.getSecret and returns the resolved secret", async () => {
    const { getSecret, client } = makeFakeClient("ok")
    const provider = createVoyantCloudVaultProvider({ client })
    const secret = await provider.getSecret("billing", "api_key")
    expect(getSecret).toHaveBeenCalledWith("billing", "api_key")
    expect(secret).toEqual({
      key: "api_key",
      value: "value-of-billing-api_key",
      version: 7,
      updatedAt: "2026-04-26T00:00:00.000Z",
    })
  })

  it("returns null when the cloud throws", async () => {
    const { client } = makeFakeClient("throw")
    const provider = createVoyantCloudVaultProvider({ client })
    expect(await provider.getSecret("billing", "missing")).toBeNull()
  })
})
