import { describe, expect, it, vi } from "vitest"

import { createNetopiaClient, resolveNetopiaRuntimeOptions } from "../../src/client.js"
import type { NetopiaFetch } from "../../src/types.js"

function jsonResponse(status: number, body: unknown) {
  const text = JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(text),
    text: async () => text,
  }
}

function textResponse(status: number, text: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new Error("not json")
    },
    text: async () => text,
  }
}

describe("resolveNetopiaRuntimeOptions", () => {
  it("merges env bindings with defaults", () => {
    const options = resolveNetopiaRuntimeOptions({
      NETOPIA_URL: "https://secure.mobilpay.ro/pay",
      NETOPIA_API_KEY: "api-key",
      NETOPIA_POS_SIGNATURE: "pos-signature",
      NETOPIA_NOTIFY_URL: "https://api.example.com/netopia/callback",
      NETOPIA_REDIRECT_URL: "https://app.example.com/checkout/return",
    })
    expect(options.language).toBe("ro")
    expect(options.emailTemplate).toBe("confirm")
    expect(options.successStatuses).toEqual([3, 5])
  })

  it("throws when required config is missing", () => {
    expect(() => resolveNetopiaRuntimeOptions({})).toThrow(/NETOPIA_URL/)
  })
})

describe("createNetopiaClient.startCardPayment", () => {
  it("posts to /payment/card/start with Authorization header", async () => {
    const fetchMock = vi.fn<NetopiaFetch>(async () =>
      jsonResponse(200, {
        payment: { paymentURL: "https://secure.example.com/pay", ntpID: "ntp_123", status: 1 },
      }),
    )

    const client = createNetopiaClient({
      apiUrl: "https://secure.mobilpay.ro/pay/",
      apiKey: "api-key",
      fetch: fetchMock,
    })

    const response = await client.startCardPayment({
      config: {
        emailTemplate: "confirm",
        notifyUrl: "https://api.example.com/callback",
        redirectUrl: "https://app.example.com/return",
        language: "ro",
      },
      payment: {
        options: { installments: 1 },
      },
      order: {
        posSignature: "pos-signature",
        dateTime: new Date().toISOString(),
        description: "Tour deposit",
        orderID: "pmss_123",
        amount: 125,
        currency: "RON",
        billing: {
          email: "traveler@example.com",
          phone: "0712345678",
          firstName: "Ana",
          lastName: "Popescu",
          city: "Bucharest",
          country: 40,
          state: "B",
          postalCode: "010101",
          details: "Str. Exemplu 1",
        },
        shipping: {
          email: "traveler@example.com",
          phone: "0712345678",
          firstName: "Ana",
          lastName: "Popescu",
          city: "Bucharest",
          country: 40,
          state: "B",
          postalCode: "010101",
          details: "Str. Exemplu 1",
        },
        products: [{ name: "Tour deposit", price: 125, vat: 0 }],
        installments: { selected: 1, available: [0] },
      },
    })

    expect(response.payment?.ntpID).toBe("ntp_123")
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://secure.mobilpay.ro/pay/payment/card/start")
    expect(init.method).toBe("POST")
    expect(init.headers.Authorization).toBe("api-key")
  })

  it("throws on provider error payload", async () => {
    const fetchMock = vi.fn<NetopiaFetch>(async () =>
      jsonResponse(200, { error: { code: "bad_request", message: "No merchant" } }),
    )

    const client = createNetopiaClient({
      apiUrl: "https://secure.mobilpay.ro/pay",
      apiKey: "api-key",
      fetch: fetchMock,
    })

    await expect(
      client.startCardPayment({
        config: {
          emailTemplate: "confirm",
          notifyUrl: "https://api.example.com/callback",
          redirectUrl: "https://app.example.com/return",
          language: "ro",
        },
        payment: {
          options: { installments: 1 },
        },
        order: {
          posSignature: "pos-signature",
          dateTime: new Date().toISOString(),
          description: "Tour deposit",
          orderID: "pmss_123",
          amount: 125,
          currency: "RON",
          billing: {
            email: "traveler@example.com",
            phone: "0712345678",
            firstName: "Ana",
            lastName: "Popescu",
            city: "Bucharest",
            country: 40,
            state: "B",
            postalCode: "010101",
            details: "Str. Exemplu 1",
          },
          shipping: {
            email: "traveler@example.com",
            phone: "0712345678",
            firstName: "Ana",
            lastName: "Popescu",
            city: "Bucharest",
            country: 40,
            state: "B",
            postalCode: "010101",
            details: "Str. Exemplu 1",
          },
          products: [{ name: "Tour deposit", price: 125, vat: 0 }],
          installments: { selected: 1, available: [0] },
        },
      }),
    ).rejects.toThrow(/Netopia start payment failed/)
  })

  it("throws when fetch is unavailable", async () => {
    const originalFetch = globalThis.fetch
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: undefined,
      writable: true,
    })
    try {
      const client = createNetopiaClient({
        apiUrl: "https://secure.mobilpay.ro/pay",
        apiKey: "api-key",
      })
      await expect(
        client.startCardPayment({
          config: {
            emailTemplate: "confirm",
            notifyUrl: "https://api.example.com/callback",
            redirectUrl: "https://app.example.com/return",
            language: "ro",
          },
          payment: {
            options: { installments: 1 },
          },
          order: {
            posSignature: "pos-signature",
            dateTime: new Date().toISOString(),
            description: "Tour deposit",
            orderID: "pmss_123",
            amount: 125,
            currency: "RON",
            billing: {
              email: "traveler@example.com",
              phone: "0712345678",
              firstName: "Ana",
              lastName: "Popescu",
              city: "Bucharest",
              country: 40,
              state: "B",
              postalCode: "010101",
              details: "Str. Exemplu 1",
            },
            shipping: {
              email: "traveler@example.com",
              phone: "0712345678",
              firstName: "Ana",
              lastName: "Popescu",
              city: "Bucharest",
              country: 40,
              state: "B",
              postalCode: "010101",
              details: "Str. Exemplu 1",
            },
            products: [{ name: "Tour deposit", price: 125, vat: 0 }],
            installments: { selected: 1, available: [0] },
          },
        }),
      ).rejects.toThrow(/requires a fetch implementation/)
    } finally {
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        value: originalFetch,
        writable: true,
      })
    }
  })

  it("surfaces non-2xx HTTP failures", async () => {
    const fetchMock = vi.fn<NetopiaFetch>(async () => textResponse(500, "gateway error"))
    const client = createNetopiaClient({
      apiUrl: "https://secure.mobilpay.ro/pay",
      apiKey: "api-key",
      fetch: fetchMock,
    })

    await expect(
      client.startCardPayment({
        config: {
          emailTemplate: "confirm",
          notifyUrl: "https://api.example.com/callback",
          redirectUrl: "https://app.example.com/return",
          language: "ro",
        },
        payment: {
          options: { installments: 1 },
        },
        order: {
          posSignature: "pos-signature",
          dateTime: new Date().toISOString(),
          description: "Tour deposit",
          orderID: "pmss_123",
          amount: 125,
          currency: "RON",
          billing: {
            email: "traveler@example.com",
            phone: "0712345678",
            firstName: "Ana",
            lastName: "Popescu",
            city: "Bucharest",
            country: 40,
            state: "B",
            postalCode: "010101",
            details: "Str. Exemplu 1",
          },
          shipping: {
            email: "traveler@example.com",
            phone: "0712345678",
            firstName: "Ana",
            lastName: "Popescu",
            city: "Bucharest",
            country: 40,
            state: "B",
            postalCode: "010101",
            details: "Str. Exemplu 1",
          },
          products: [{ name: "Tour deposit", price: 125, vat: 0 }],
          installments: { selected: 1, available: [0] },
        },
      }),
    ).rejects.toThrow(/\(500\)/)
  })
})
