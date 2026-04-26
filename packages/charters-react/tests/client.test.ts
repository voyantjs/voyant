import { describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { fetchWithValidation, VoyantApiError } from "../src/client.js"

const okBody = z.object({ data: z.object({ id: z.string() }) })

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  })
}

describe("fetchWithValidation", () => {
  it("joins baseUrl + path correctly (no double slash)", async () => {
    const fetcher = vi.fn(() => Promise.resolve(jsonResponse({ data: { id: "ok" } })))
    await fetchWithValidation("/v1/admin/charters/products", okBody, {
      baseUrl: "https://api.example.com/",
      fetcher,
    })
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.com/v1/admin/charters/products",
      expect.any(Object),
    )
  })

  it("returns the parsed body on 2xx", async () => {
    const fetcher = vi.fn(() => Promise.resolve(jsonResponse({ data: { id: "chrt_abc" } })))
    const result = await fetchWithValidation("/x", okBody, {
      baseUrl: "https://api.example.com",
      fetcher,
    })
    expect(result.data.id).toBe("chrt_abc")
  })

  it("throws VoyantApiError with the server's `error` string on 4xx", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        jsonResponse(
          { error: "external_charter_read_only" },
          { status: 409, statusText: "Conflict" },
        ),
      ),
    )
    await expect(
      fetchWithValidation("/x", okBody, { baseUrl: "https://api.example.com", fetcher }),
    ).rejects.toMatchObject({
      name: "VoyantApiError",
      status: 409,
      message: "external_charter_read_only",
    })
  })

  it("throws VoyantApiError when the response shape doesn't match the schema", async () => {
    const fetcher = vi.fn(() => Promise.resolve(jsonResponse({ wrong: "shape" })))
    await expect(
      fetchWithValidation("/x", okBody, { baseUrl: "https://api.example.com", fetcher }),
    ).rejects.toBeInstanceOf(VoyantApiError)
  })

  it("sets Content-Type when body is provided and header is missing", async () => {
    let capturedHeaders: Headers | undefined
    const fetcher = vi.fn((_url, init?: RequestInit) => {
      capturedHeaders = init?.headers as Headers
      return Promise.resolve(jsonResponse({ data: { id: "x" } }))
    })
    await fetchWithValidation(
      "/x",
      okBody,
      {
        baseUrl: "https://api.example.com",
        fetcher,
      },
      {
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      },
    )
    expect(capturedHeaders?.get("Content-Type")).toBe("application/json")
  })
})
