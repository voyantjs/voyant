import { describe, expect, it, vi } from "vitest"

import { buildNotificationTaskRuntime } from "../../src/task-runtime.js"

describe("buildNotificationTaskRuntime", () => {
  it("registers resolved providers once", () => {
    const resolveProviders = vi.fn(() => [
      {
        name: "email-provider",
        channels: ["email"],
        send: vi.fn(async () => ({ id: "ntf_123", provider: "email-provider" })),
      },
    ])

    const runtime = buildNotificationTaskRuntime(
      { RESEND_API_KEY: "resend_test", EMAIL_FROM: "hello@example.com" },
      { resolveProviders },
    )

    expect(resolveProviders).toHaveBeenCalledOnce()
    expect(runtime.providers).toHaveLength(1)
    expect(runtime.providers[0]?.name).toBe("email-provider")
  })
})
