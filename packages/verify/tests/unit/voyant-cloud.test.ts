import { describe, expect, it, vi } from "vitest"

import { createVoyantCloudVerifyProvider } from "../../src/providers/voyant-cloud.js"

function makeFakeClient(startResponse: unknown, checkResponse: unknown) {
  const start = vi.fn(async () => startResponse)
  const check = vi.fn(async () => checkResponse)
  return {
    start,
    check,
    client: {
      verification: { start, check },
    } as unknown as Parameters<typeof createVoyantCloudVerifyProvider>[0]["client"],
  }
}

describe("createVoyantCloudVerifyProvider", () => {
  it("delegates to verification.start with channel + locale", async () => {
    const { start, client } = makeFakeClient(
      {
        id: "vrf_1",
        channel: "sms",
        toValue: "+40123",
        status: "pending",
      },
      undefined,
    )

    const provider = createVoyantCloudVerifyProvider({
      client,
      defaultChannel: "sms",
      defaultLocale: "en",
    })

    const attempt = await provider.start({ to: "+40123" })

    expect(start).toHaveBeenCalledWith({ to: "+40123", channel: "sms", locale: "en" })
    expect(attempt).toEqual({
      id: "vrf_1",
      channel: "sms",
      to: "+40123",
      status: "pending",
    })
  })

  it("delegates to verification.check and surfaces validity", async () => {
    const { check, client } = makeFakeClient(undefined, {
      id: "vrf_2",
      channel: "email",
      toValue: "x@example.com",
      status: "approved",
      valid: true,
    })

    const provider = createVoyantCloudVerifyProvider({ client })

    const result = await provider.check({ to: "x@example.com", code: "123456" })

    expect(check).toHaveBeenCalledWith({ to: "x@example.com", code: "123456" })
    expect(result).toEqual({
      id: "vrf_2",
      channel: "email",
      to: "x@example.com",
      status: "approved",
      valid: true,
    })
  })

  it("normalizes unknown channel/status values to safe defaults", async () => {
    const { client } = makeFakeClient(
      { id: "vrf_3", channel: "carrier-pigeon", toValue: "x", status: "unknown" },
      undefined,
    )

    const provider = createVoyantCloudVerifyProvider({ client })
    const attempt = await provider.start({ to: "x" })
    expect(attempt.channel).toBe("sms")
    expect(attempt.status).toBe("pending")
  })
})
