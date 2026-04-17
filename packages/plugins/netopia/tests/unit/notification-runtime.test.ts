import { describe, expect, it, vi } from "vitest"

import { buildNetopiaNotificationRuntime } from "../../src/notification-runtime.js"

describe("buildNetopiaNotificationRuntime", () => {
  it("uses resolved notification providers once", () => {
    const resolveNotificationProviders = vi.fn(() => [
      {
        name: "email-provider",
        channels: ["email"],
        send: vi.fn(async () => ({ id: "ntf_123", provider: "email-provider" })),
      },
    ])

    const runtime = buildNetopiaNotificationRuntime(
      { RESEND_API_KEY: "resend_test", EMAIL_FROM: "hello@example.com" },
      { resolveNotificationProviders },
    )

    expect(resolveNotificationProviders).toHaveBeenCalledOnce()
    expect(runtime.dispatcher).toBeTruthy()
  })

  it("prefers an explicit dispatcher override", () => {
    const dispatcher = {
      send: vi.fn(async () => ({
        id: "ntf_123",
        channel: "email",
        provider: "email-provider",
      })),
    }

    const runtime = buildNetopiaNotificationRuntime({}, {}, dispatcher as never)

    expect(runtime.dispatcher).toBe(dispatcher)
  })
})
