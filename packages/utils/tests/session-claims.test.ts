import { describe, expect, it } from "vitest"

import { signSessionClaims, verifySessionClaims } from "../src/session-claims.js"

const SECRET = "test-secret"

describe("session claims", () => {
  it("round-trips signed claims", async () => {
    const token = await signSessionClaims("user_123", "session_456", SECRET)

    await expect(verifySessionClaims(token, SECRET)).resolves.toMatchObject({
      userId: "user_123",
    })
  })

  it("rejects tampered tokens", async () => {
    const token = await signSessionClaims("user_123", "session_456", SECRET)
    const [header, payload] = token.split(".")
    const tampered = `${header}.${payload}.invalid`

    await expect(verifySessionClaims(tampered, SECRET)).resolves.toBeNull()
  })

  it("rejects expired claims", async () => {
    const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    const payload = base64UrlEncode(
      JSON.stringify({
        userId: "user_123",
        sessionId: "session_hash",
        iat: 1,
        exp: 1,
      }),
    )
    const signature = await signHmac(`${header}.${payload}`, SECRET)
    const expired = `${header}.${payload}.${signature}`

    await expect(verifySessionClaims(expired, SECRET)).resolves.toBeNull()
  })
})

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

async function signHmac(message: string, secret: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}
