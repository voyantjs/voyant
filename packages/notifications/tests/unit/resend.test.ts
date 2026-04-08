import { describe, expect, it, vi } from "vitest"

import type { ResendFetch } from "../../src/providers/resend.js"
import { createResendProvider } from "../../src/providers/resend.js"

function okResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

function errorResponse(status: number, text: string) {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => text,
  }
}

describe("createResendProvider", () => {
  it("sends an email via the Resend HTTP API", async () => {
    const fetchMock = vi.fn<ResendFetch>(async () => okResponse({ id: "em_abc" }))
    const provider = createResendProvider({
      apiKey: "re_test",
      from: "hello@voyant.dev",
      fetch: fetchMock,
    })

    const result = await provider.send({
      to: "client@example.com",
      channel: "email",
      template: "welcome",
      data: { name: "Mihai" },
      subject: "Welcome to Voyant",
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://api.resend.com/emails")
    expect(init.method).toBe("POST")
    expect(init.headers.Authorization).toBe("Bearer re_test")
    expect(init.headers["Content-Type"]).toBe("application/json")
    const body = JSON.parse(init.body) as Record<string, unknown>
    expect(body.from).toBe("hello@voyant.dev")
    expect(body.to).toBe("client@example.com")
    expect(body.subject).toBe("Welcome to Voyant")
    expect(body.text).toBe('{"name":"Mihai"}')
    expect(result).toEqual({ id: "em_abc", provider: "resend" })
  })

  it("uses the payload `from` override when present", async () => {
    const fetchMock = vi.fn<ResendFetch>(async () => okResponse({ id: "em_1" }))
    const provider = createResendProvider({
      apiKey: "re_test",
      from: "default@voyant.dev",
      fetch: fetchMock,
    })
    await provider.send({
      to: "c@example.com",
      channel: "email",
      template: "t",
      from: "override@voyant.dev",
    })
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body) as Record<string, unknown>
    expect(body.from).toBe("override@voyant.dev")
  })

  it("renders the email body via the provided renderTemplate", async () => {
    const fetchMock = vi.fn<ResendFetch>(async () => okResponse({ id: "em_2" }))
    const renderTemplate = vi.fn(async (template: string, data: unknown) => ({
      subject: `Template: ${template}`,
      html: `<p>data: ${JSON.stringify(data)}</p>`,
      text: `data: ${JSON.stringify(data)}`,
    }))
    const provider = createResendProvider({
      apiKey: "re_test",
      from: "hello@voyant.dev",
      fetch: fetchMock,
      renderTemplate,
    })
    await provider.send({
      to: "c@example.com",
      channel: "email",
      template: "booking-confirmed",
      data: { bookingId: "book_1" },
    })
    expect(renderTemplate).toHaveBeenCalledWith("booking-confirmed", { bookingId: "book_1" })
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body) as Record<string, unknown>
    expect(body.subject).toBe("Template: booking-confirmed")
    expect(body.html).toBe('<p>data: {"bookingId":"book_1"}</p>')
    expect(body.text).toBe('data: {"bookingId":"book_1"}')
  })

  it("prefers pre-rendered html/text from the payload when present", async () => {
    const fetchMock = vi.fn<ResendFetch>(async () => okResponse({ id: "em_4" }))
    const renderTemplate = vi.fn(async () => ({
      subject: "Rendered Subject",
      html: "<p>Rendered</p>",
      text: "Rendered",
    }))
    const provider = createResendProvider({
      apiKey: "re_test",
      from: "hello@voyant.dev",
      fetch: fetchMock,
      renderTemplate,
    })

    await provider.send({
      to: "c@example.com",
      channel: "email",
      template: "booking-confirmed",
      html: "<p>Direct HTML</p>",
      text: "Direct text",
    })

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body) as Record<string, unknown>
    expect(body.html).toBe("<p>Direct HTML</p>")
    expect(body.text).toBe("Direct text")
  })

  it("rejects non-email channels", async () => {
    const provider = createResendProvider({
      apiKey: "re_test",
      from: "hello@voyant.dev",
      fetch: vi.fn<ResendFetch>(),
    })
    await expect(provider.send({ to: "+123", channel: "sms", template: "t" })).rejects.toThrow(
      /only supports the "email" channel/,
    )
  })

  it("throws when the API responds with an error status", async () => {
    const fetchMock = vi.fn<ResendFetch>(async () =>
      errorResponse(422, '{"message":"Invalid from"}'),
    )
    const provider = createResendProvider({
      apiKey: "re_test",
      from: "hello@voyant.dev",
      fetch: fetchMock,
    })
    await expect(
      provider.send({ to: "c@example.com", channel: "email", template: "t" }),
    ).rejects.toThrow(/Resend send failed \(422\)/)
  })

  it("honors a custom baseUrl", async () => {
    const fetchMock = vi.fn<ResendFetch>(async () => okResponse({ id: "em_3" }))
    const provider = createResendProvider({
      apiKey: "re_test",
      from: "hello@voyant.dev",
      fetch: fetchMock,
      baseUrl: "https://custom.resend.example",
    })
    await provider.send({ to: "c@example.com", channel: "email", template: "t" })
    expect(fetchMock.mock.calls[0]![0]).toBe("https://custom.resend.example/emails")
  })

  it("advertises only the email channel", () => {
    const provider = createResendProvider({
      apiKey: "re_test",
      from: "hello@voyant.dev",
      fetch: vi.fn<ResendFetch>(),
    })
    expect(provider.channels).toEqual(["email"])
    expect(provider.name).toBe("resend")
  })
})
