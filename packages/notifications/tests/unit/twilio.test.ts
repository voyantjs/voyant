import { describe, expect, it, vi } from "vitest"

import { createTwilioProvider } from "../../src/providers/twilio.js"

describe("createTwilioProvider", () => {
  it("sends sms payloads through the Twilio API", async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ sid: "SM123" }),
      text: async () => "",
    }))

    const provider = createTwilioProvider({
      accountSid: "AC123",
      authToken: "secret",
      from: "+40000000000",
      fetch,
      renderTemplate: () => ({ text: "123456 is your verification code." }),
    })

    const result = await provider.send({
      to: "+40123456789",
      channel: "sms",
      template: "storefront-verification-sms",
      data: { code: "123456" },
    })

    expect(fetch).toHaveBeenCalledWith(
      "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
        body: expect.stringContaining("To=%2B40123456789"),
      }),
    )
    expect(result).toEqual({ id: "SM123", provider: "twilio" })
  })

  it("rejects non-sms payloads", async () => {
    const provider = createTwilioProvider({
      accountSid: "AC123",
      authToken: "secret",
      from: "+40000000000",
      fetch: vi.fn(),
    })

    await expect(
      provider.send({
        to: "traveler@example.com",
        channel: "email",
        template: "x",
      }),
    ).rejects.toThrow(/only supports the "sms" channel/)
  })
})
