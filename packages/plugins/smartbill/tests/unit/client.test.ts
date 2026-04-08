import { describe, expect, it, vi } from "vitest"

import { createSmartbillClient } from "../../src/client.js"
import type { SmartbillFetch } from "../../src/types.js"

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

const baseOptions = {
  username: "user@example.com",
  apiToken: "test-token",
}

describe("createSmartbillClient.createInvoice", () => {
  it("sends POST to /invoice with basic auth", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () =>
      jsonResponse(200, { number: "1", series: "A" }),
    )
    const client = createSmartbillClient({ ...baseOptions, fetch: fetchMock })
    const result = await client.createInvoice({
      companyVatCode: "RO123",
      client: { name: "Acme" },
      seriesName: "A",
      currency: "RON",
      products: [
        {
          name: "Tour",
          measureUnit: "buc",
          quantity: 1,
          price: 100,
          currency: "RON",
          isTaxIncluded: true,
        },
      ],
    })
    expect(result).toEqual({ number: "1", series: "A" })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://ws.smartbill.ro/SBORO/api/invoice")
    expect(init.method).toBe("POST")
    expect(init.headers.Authorization).toMatch(/^Basic /)
    expect(init.headers["Content-Type"]).toBe("application/json")
    const body = JSON.parse(init.body ?? "{}")
    expect(body.companyVatCode).toBe("RO123")
    expect(body.products).toHaveLength(1)
  })

  it("throws on non-2xx response", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () => textResponse(400, "bad request"))
    const client = createSmartbillClient({ ...baseOptions, fetch: fetchMock })
    await expect(
      client.createInvoice({
        companyVatCode: "RO123",
        client: { name: "X" },
        seriesName: "A",
        currency: "RON",
        products: [],
      }),
    ).rejects.toThrow(/SmartBill createInvoice failed \(400\)/)
  })
})

describe("createSmartbillClient.createProforma", () => {
  it("sends POST to /estimate", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () =>
      jsonResponse(200, { number: "P1", series: "P" }),
    )
    const client = createSmartbillClient({ ...baseOptions, fetch: fetchMock })
    await client.createProforma({
      companyVatCode: "RO123",
      client: { name: "X" },
      seriesName: "P",
      currency: "RON",
      products: [],
    })
    const [url] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://ws.smartbill.ro/SBORO/api/estimate")
  })
})

describe("createSmartbillClient.cancelInvoice", () => {
  it("sends PUT to /invoice/cancel", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () => jsonResponse(200, {}))
    const client = createSmartbillClient({ ...baseOptions, fetch: fetchMock })
    await client.cancelInvoice("RO123", "A", "42")
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://ws.smartbill.ro/SBORO/api/invoice/cancel")
    expect(init.method).toBe("PUT")
    const body = JSON.parse(init.body ?? "{}")
    expect(body).toEqual({ companyVatCode: "RO123", seriesName: "A", number: "42" })
  })

  it("throws on error", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () => textResponse(500, "fail"))
    const client = createSmartbillClient({ ...baseOptions, fetch: fetchMock })
    await expect(client.cancelInvoice("RO123", "A", "1")).rejects.toThrow(
      /SmartBill cancelInvoice failed \(500\)/,
    )
  })
})

describe("createSmartbillClient.deleteInvoice", () => {
  it("sends DELETE to /invoice with query params", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () => jsonResponse(200, {}))
    const client = createSmartbillClient({ ...baseOptions, fetch: fetchMock })
    await client.deleteInvoice("RO123", "A", "42")
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toContain("/invoice?cif=RO123&seriesname=A&number=42")
    expect(init.method).toBe("DELETE")
  })
})

describe("createSmartbillClient.reverseInvoice", () => {
  it("sends PUT to /invoice/reverse", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () =>
      jsonResponse(200, { number: "S1", series: "S" }),
    )
    const client = createSmartbillClient({ ...baseOptions, fetch: fetchMock })
    const result = await client.reverseInvoice("RO123", "A", "42")
    expect(result).toEqual({ number: "S1", series: "S" })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://ws.smartbill.ro/SBORO/api/invoice/reverse")
    expect(init.method).toBe("PUT")
  })
})

describe("createSmartbillClient.viewPdf", () => {
  it("sends GET to /invoice/pdf with query params", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () =>
      jsonResponse(200, { url: "https://smartbill.ro/pdf/123" }),
    )
    const client = createSmartbillClient({ ...baseOptions, fetch: fetchMock })
    const result = await client.viewPdf("RO123", "A", "42")
    expect(result.url).toBe("https://smartbill.ro/pdf/123")
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toContain("/invoice/pdf?cif=RO123&seriesname=A&number=42")
    expect(init.method).toBe("GET")
  })
})

describe("createSmartbillClient.getPaymentStatus", () => {
  it("sends GET to /invoice/paymentstatus", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () =>
      jsonResponse(200, { status: "paid", paidAmount: 100, unpaidAmount: 0 }),
    )
    const client = createSmartbillClient({ ...baseOptions, fetch: fetchMock })
    const result = await client.getPaymentStatus("RO123", "A", "42")
    expect(result).toEqual({ status: "paid", paidAmount: 100, unpaidAmount: 0 })
    const [url] = fetchMock.mock.calls[0]!
    expect(url).toContain("/invoice/paymentstatus?cif=RO123&seriesname=A&number=42")
  })
})

describe("createSmartbillClient — custom apiUrl", () => {
  it("respects custom API base URL", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () => jsonResponse(200, {}))
    const client = createSmartbillClient({
      ...baseOptions,
      apiUrl: "https://custom.example.com/api/",
      fetch: fetchMock,
    })
    await client.cancelInvoice("RO1", "A", "1")
    const [url] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://custom.example.com/api/invoice/cancel")
  })
})

describe("createSmartbillClient — basic auth encoding", () => {
  it("encodes username:token as base64", async () => {
    const fetchMock = vi.fn<SmartbillFetch>(async () => jsonResponse(200, {}))
    const client = createSmartbillClient({
      username: "test@test.com",
      apiToken: "secret123",
      fetch: fetchMock,
    })
    await client.cancelInvoice("X", "A", "1")
    const [, init] = fetchMock.mock.calls[0]!
    const expected = `Basic ${btoa("test@test.com:secret123")}`
    expect(init.headers.Authorization).toBe(expected)
  })
})

describe("createSmartbillClient — fetch handling", () => {
  it("throws when no fetch implementation is available", async () => {
    const originalFetch = globalThis.fetch
    // biome-ignore lint/suspicious/noExplicitAny: stubbing global fetch
    ;(globalThis as any).fetch = undefined
    try {
      // biome-ignore lint/suspicious/noExplicitAny: simulating missing fetch
      const client = createSmartbillClient({ ...baseOptions, fetch: undefined as any })
      await expect(client.cancelInvoice("X", "A", "1")).rejects.toThrow(
        /requires a fetch implementation/,
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
