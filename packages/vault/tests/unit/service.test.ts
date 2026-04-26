import { describe, expect, it, vi } from "vitest"

import { createVaultService, VaultError } from "../../src/service.js"

function fakeProvider(values: Record<string, string | null>) {
  const getSecret = vi.fn(async (_slug: string, key: string) => {
    const value = values[key]
    return value === undefined || value === null ? null : { key, value, version: 1 }
  })
  return {
    getSecret,
    provider: { name: "fake", getSecret },
  }
}

describe("createVaultService", () => {
  it("caches secrets per (slug, key) by default", async () => {
    const { getSecret, provider } = fakeProvider({ k: "v" })
    const svc = createVaultService(provider)

    await svc.getSecret("slug", "k")
    await svc.getSecret("slug", "k")
    await svc.getSecret("other", "k")

    expect(getSecret).toHaveBeenCalledTimes(2)
  })

  it("can disable caching", async () => {
    const { getSecret, provider } = fakeProvider({ k: "v" })
    const svc = createVaultService(provider, { noCache: true })

    await svc.getSecret("slug", "k")
    await svc.getSecret("slug", "k")

    expect(getSecret).toHaveBeenCalledTimes(2)
  })

  it("requireSecret throws when the key is absent", async () => {
    const { provider } = fakeProvider({ present: "v" })
    const svc = createVaultService(provider)

    await expect(svc.requireSecret("slug", "missing")).rejects.toBeInstanceOf(VaultError)
    await expect(svc.requireSecret("slug", "present")).resolves.toEqual(
      expect.objectContaining({ value: "v" }),
    )
  })
})
