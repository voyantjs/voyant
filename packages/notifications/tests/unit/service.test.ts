import { describe, expect, it, vi } from "vitest"

import {
  createDefaultNotificationProviders,
  createResendProviderFromEnv,
} from "../../src/provider-resolution.js"
import { createLocalProvider } from "../../src/providers/local.js"
import {
  createNotificationService,
  NotificationError,
  renderNotificationTemplate,
} from "../../src/service.js"
import type { NotificationProvider } from "../../src/types.js"

function fakeProvider(name: string, channels: string[]): NotificationProvider {
  return {
    name,
    channels,
    send: vi.fn(async () => ({ id: `${name}_1`, provider: name })),
  }
}

describe("createNotificationService", () => {
  it("routes payloads to the provider registered for the channel", async () => {
    const email = fakeProvider("resend", ["email"])
    const sms = fakeProvider("twilio", ["sms"])
    const service = createNotificationService([email, sms])

    await service.send({ to: "c@example.com", channel: "email", template: "t" })
    await service.send({ to: "+123", channel: "sms", template: "t" })

    expect(email.send).toHaveBeenCalledOnce()
    expect(sms.send).toHaveBeenCalledOnce()
  })

  it("throws when no provider handles the payload channel", async () => {
    const service = createNotificationService([fakeProvider("resend", ["email"])])
    await expect(service.send({ to: "c", channel: "slack", template: "t" })).rejects.toBeInstanceOf(
      NotificationError,
    )
  })

  it("later providers override earlier ones on channel conflict", async () => {
    const first = fakeProvider("first", ["email"])
    const second = fakeProvider("second", ["email"])
    const service = createNotificationService([first, second])

    const result = await service.send({
      to: "c@example.com",
      channel: "email",
      template: "t",
    })

    expect(first.send).not.toHaveBeenCalled()
    expect(second.send).toHaveBeenCalledOnce()
    expect(result.provider).toBe("second")
  })

  it("sendWith dispatches to a specific provider by name", async () => {
    const resend = fakeProvider("resend", ["email"])
    const local = fakeProvider("local", ["email"])
    const service = createNotificationService([resend, local])

    const result = await service.sendWith("resend", {
      to: "c@example.com",
      channel: "email",
      template: "t",
    })

    expect(resend.send).toHaveBeenCalledOnce()
    expect(local.send).not.toHaveBeenCalled()
    expect(result.provider).toBe("resend")
  })

  it("sendWith throws when provider name is unknown", async () => {
    const service = createNotificationService([fakeProvider("resend", ["email"])])
    await expect(
      service.sendWith("unknown", { to: "c", channel: "email", template: "t" }),
    ).rejects.toBeInstanceOf(NotificationError)
  })

  it("getProvider returns the provider for a channel", () => {
    const email = fakeProvider("resend", ["email"])
    const multi = fakeProvider("multi", ["sms", "push"])
    const service = createNotificationService([email, multi])
    expect(service.getProvider("email")).toBe(email)
    expect(service.getProvider("sms")).toBe(multi)
    expect(service.getProvider("push")).toBe(multi)
    expect(service.getProvider("slack")).toBeUndefined()
  })

  it("integrates with the local provider end-to-end", async () => {
    const sink = vi.fn()
    const service = createNotificationService([createLocalProvider({ sink, channels: ["email"] })])
    const result = await service.send({
      to: "a@example.com",
      channel: "email",
      template: "welcome",
      data: { foo: "bar" },
    })
    expect(sink).toHaveBeenCalledOnce()
    expect(result.provider).toBe("local")
  })

  it("prefers the hinted provider when payload.provider is set", async () => {
    const resend = fakeProvider("resend", ["email"])
    const local = fakeProvider("local", ["email"])
    const service = createNotificationService([resend, local])

    const result = await service.send({
      to: "c@example.com",
      channel: "email",
      provider: "resend",
      template: "t",
    })

    expect(resend.send).toHaveBeenCalledOnce()
    expect(local.send).not.toHaveBeenCalled()
    expect(result.provider).toBe("resend")
  })
})

describe("renderNotificationTemplate", () => {
  it("renders simple placeholders", () => {
    expect(
      renderNotificationTemplate("Hello {{ person.firstName }}", {
        person: { firstName: "Mihai" },
      }),
    ).toBe("Hello Mihai")
  })

  it("returns null for empty templates", () => {
    expect(renderNotificationTemplate(null, {})).toBeNull()
  })

  it("stringifies complex values when needed", () => {
    expect(
      renderNotificationTemplate("Payload: {{ data }}", {
        data: { bookingId: "book_1" },
      }),
    ).toBe('Payload: {"bookingId":"book_1"}')
  })
})

describe("createDefaultNotificationProviders", () => {
  it("defaults to the local provider only", () => {
    expect(createDefaultNotificationProviders({}).map((provider) => provider.name)).toEqual([
      "local",
    ])
    expect(
      createDefaultNotificationProviders({
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "noreply@example.com",
      }).map((provider) => provider.name),
    ).toEqual(["local"])
  })

  it("adds resend only when explicitly requested", () => {
    expect(
      createDefaultNotificationProviders(
        {
          RESEND_API_KEY: "re_test",
          EMAIL_FROM: "noreply@example.com",
        },
        {
          emailProvider: "resend",
        },
      ).map((provider) => provider.name),
    ).toEqual(["local", "resend"])
  })
})

describe("createResendProviderFromEnv", () => {
  it("returns null when env is incomplete", () => {
    expect(createResendProviderFromEnv({ EMAIL_FROM: "noreply@example.com" })).toBeNull()
  })

  it("creates a resend provider when env is complete", () => {
    const provider = createResendProviderFromEnv({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "noreply@example.com",
    })
    expect(provider?.name).toBe("resend")
  })
})
