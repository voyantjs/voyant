import { describe, expect, it } from "vitest"
import {
  AUTH_HEADER,
  createBearerVerifier,
  createHmacSigner,
  createHmacVerifier,
} from "../index.js"

const SECRET = "s3cret-dev-key-please-rotate-before-prod"

function signed(url: string, body: string, header: string): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [AUTH_HEADER]: header,
    },
    body,
  })
}

describe("createHmacSigner / createHmacVerifier", () => {
  it("rejects an empty secret", async () => {
    await expect(createHmacSigner("")).rejects.toThrow(/non-empty/)
    await expect(createHmacVerifier("")).rejects.toThrow(/non-empty/)
  })

  it("sign + verify round-trip succeeds with the same secret + body", async () => {
    const sign = await createHmacSigner(SECRET)
    const verify = await createHmacVerifier(SECRET)
    const body = JSON.stringify({ runId: "run_1", invocationCount: 1 })
    const sig = await sign(body)
    const req = signed("https://t/x", body, sig)
    await expect(verify(req)).resolves.toBeUndefined()
  })

  it("signature is deterministic for the same body + secret", async () => {
    const sign = await createHmacSigner(SECRET)
    const body = '{"ok":true}'
    const a = await sign(body)
    const b = await sign(body)
    expect(a).toBe(b)
  })

  it("different bodies produce different signatures", async () => {
    const sign = await createHmacSigner(SECRET)
    const a = await sign('{"x":1}')
    const b = await sign('{"x":2}')
    expect(a).not.toBe(b)
  })

  it("fails when the body was tampered with post-signing", async () => {
    const sign = await createHmacSigner(SECRET)
    const verify = await createHmacVerifier(SECRET)
    const original = '{"amount":100}'
    const sig = await sign(original)
    const tampered = '{"amount":10000}'
    const req = signed("https://t/x", tampered, sig)
    await expect(verify(req)).rejects.toThrow(/does not match/)
  })

  it("fails when the verifier uses a different secret", async () => {
    const sign = await createHmacSigner("secret-A")
    const verify = await createHmacVerifier("secret-B")
    const body = '{"y":1}'
    const req = signed("https://t/x", body, await sign(body))
    await expect(verify(req)).rejects.toThrow(/does not match/)
  })

  it("fails when the header is missing", async () => {
    const verify = await createHmacVerifier(SECRET)
    const req = new Request("https://t/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"x":1}',
    })
    await expect(verify(req)).rejects.toThrow(/missing .* header/)
  })

  it("fails when the header is not valid base64", async () => {
    const verify = await createHmacVerifier(SECRET)
    const req = signed("https://t/x", '{"x":1}', "!!! not base64 ???")
    await expect(verify(req)).rejects.toThrow(/malformed .* header/)
  })

  it("does not consume the original request body (callers can read it downstream)", async () => {
    const sign = await createHmacSigner(SECRET)
    const verify = await createHmacVerifier(SECRET)
    const body = '{"preserved":true}'
    const req = signed("https://t/x", body, await sign(body))
    await verify(req)
    // Original request body is still readable — verify cloned internally.
    const text = await req.text()
    expect(JSON.parse(text)).toEqual({ preserved: true })
  })

  it("produces base64 strings (the transport format)", async () => {
    const sign = await createHmacSigner(SECRET)
    const sig = await sign("hello")
    // HMAC-SHA256 = 32 bytes = 44 base64 chars (incl. padding).
    expect(sig).toMatch(/^[A-Za-z0-9+/]+=*$/)
    expect(sig.length).toBe(44)
  })
})

describe("createBearerVerifier", () => {
  it("rejects zero-token configs up front", () => {
    expect(() => createBearerVerifier([])).toThrow(/at least one/)
  })

  it("accepts requests whose Authorization matches a configured token", () => {
    const verify = createBearerVerifier(["primary", "secondary"])
    const req = new Request("https://t", {
      headers: { authorization: "Bearer secondary" },
    })
    expect(() => verify(req)).not.toThrow()
  })

  it("rejects a missing Authorization header", () => {
    const verify = createBearerVerifier(["x"])
    const req = new Request("https://t")
    expect(() => verify(req)).toThrow(/missing Authorization/)
  })

  it("rejects non-Bearer schemes", () => {
    const verify = createBearerVerifier(["x"])
    const req = new Request("https://t", { headers: { authorization: "Basic abc" } })
    expect(() => verify(req)).toThrow(/Bearer scheme/)
  })

  it("rejects a token that doesn't match any configured value", () => {
    const verify = createBearerVerifier(["primary"])
    const req = new Request("https://t", { headers: { authorization: "Bearer wrong" } })
    expect(() => verify(req)).toThrow(/does not match/)
  })

  it("is case-sensitive on the token comparison", () => {
    const verify = createBearerVerifier(["AbCdEf"])
    const req = new Request("https://t", { headers: { authorization: "Bearer abcdef" } })
    expect(() => verify(req)).toThrow()
  })
})
