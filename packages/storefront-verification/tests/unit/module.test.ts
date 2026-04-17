import { createContainer, createEventBus } from "@voyantjs/core"
import { describe, expect, it, vi } from "vitest"

import {
  createStorefrontVerificationHonoModule,
  STOREFRONT_VERIFICATION_SENDERS_CONTAINER_KEY,
} from "../../src/index.js"

describe("createStorefrontVerificationHonoModule.bootstrap", () => {
  it("registers the resolved sender bundle once", async () => {
    const resolveProviders = vi.fn(() => [
      {
        name: "email-provider",
        channels: ["email"],
        send: vi.fn(async () => ({ id: "ntf_123", provider: "email-provider" })),
      },
      {
        name: "sms-provider",
        channels: ["sms"],
        send: vi.fn(async () => ({ id: "ntf_456", provider: "sms-provider" })),
      },
    ])

    const module = createStorefrontVerificationHonoModule({
      resolveProviders,
    })
    const container = createContainer()

    await module.module.bootstrap?.({
      bindings: {},
      container,
      eventBus: createEventBus(),
    })

    const senders = container.resolve<{
      sendEmailChallenge?: (input: {
        email: string
        code: string
        purpose: string
        expiresAt: Date
      }) => Promise<unknown>
      sendSmsChallenge?: (input: {
        phone: string
        code: string
        purpose: string
        expiresAt: Date
      }) => Promise<unknown>
    }>(STOREFRONT_VERIFICATION_SENDERS_CONTAINER_KEY)

    expect(resolveProviders).toHaveBeenCalledOnce()
    expect(senders.sendEmailChallenge).toBeTypeOf("function")
    expect(senders.sendSmsChallenge).toBeTypeOf("function")
  })
})
