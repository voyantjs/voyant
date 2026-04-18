/**
 * Session Claims Cookie Utilities
 *
 * Implements signed session claims to reduce API calls in middleware.
 * Claims contain minimal session info (userId, sessionId hash) that can be
 * verified locally without database lookup.
 *
 * Security:
 * - HMAC-SHA256 signing prevents tampering
 * - 5-minute expiration ensures quick revocation
 * - HttpOnly, Secure, SameSite cookies
 *
 * Compatible with environments that expose the standard Web Crypto API,
 * including Node.js, browsers, and Cloudflare Workers.
 */

function getWebCrypto(): Crypto {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    return globalThis.crypto
  }

  throw new Error("No crypto implementation available")
}

export interface SessionClaims {
  userId: string
  sessionId: string // Hash/short identifier, not full session ID
  iat: number // Issued at (seconds since epoch)
  exp: number // Expiration (seconds since epoch)
}

const CLAIMS_EXPIRY_SECONDS = 5 * 60 // 5 minutes

/**
 * Create a short identifier from session ID for inclusion in claims
 * Uses first 16 chars of base64url-encoded SHA-256 hash
 */
async function hashSessionId(sessionId: string): Promise<string> {
  const webCrypto = getWebCrypto()
  const encoder = new TextEncoder()
  const data = encoder.encode(sessionId)
  const hashBuffer = await webCrypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  // Convert to base64url manually
  const hashB64 = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
  return hashB64.slice(0, 16)
}

/**
 * Sign session claims and return as JWT-like token
 *
 * Format: base64url(header).base64url(payload).base64url(signature)
 *
 * @param userId - User ID from verified session
 * @param sessionId - Full session ID (will be hashed)
 * @param secret - HMAC secret for signing
 * @returns Signed token string
 */
export async function signSessionClaims(
  userId: string,
  sessionId: string,
  secret: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + CLAIMS_EXPIRY_SECONDS

  const sessionIdHash = await hashSessionId(sessionId)
  const claims: SessionClaims = {
    userId,
    sessionId: sessionIdHash,
    iat: now,
    exp,
  }

  // Encode payload (works in both environments)
  const header = { alg: "HS256", typ: "JWT" }
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
  const payloadB64 = btoa(JSON.stringify(claims))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  // Create signature
  const message = `${headerB64}.${payloadB64}`

  const webCrypto = getWebCrypto()
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const key = await webCrypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sigBuffer = await webCrypto.subtle.sign("HMAC", key, encoder.encode(message))
  const sigArray = Array.from(new Uint8Array(sigBuffer))
  const signature = btoa(String.fromCharCode(...sigArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  return `${headerB64}.${payloadB64}.${signature}`
}

/**
 * Verify and decode session claims token
 *
 * @param token - Signed token from cookie
 * @param secret - HMAC secret for verification
 * @returns Decoded claims if valid, null if invalid/expired
 */
export async function verifySessionClaims(
  token: string,
  secret: string,
): Promise<SessionClaims | null> {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      return null
    }

    const [headerB64, payloadB64, signature] = parts

    // Ensure all parts are defined
    if (!headerB64 || !payloadB64 || !signature) {
      return null
    }

    // Verify signature
    const message = `${headerB64}.${payloadB64}`

    const webCrypto = getWebCrypto()
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await webCrypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    )
    const sigBuffer = await webCrypto.subtle.sign("HMAC", key, encoder.encode(message))
    const sigArray = Array.from(new Uint8Array(sigBuffer))
    const expectedSig = btoa(String.fromCharCode(...sigArray))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "")

    // Constant-time comparison
    if (!constantTimeEqual(signature, expectedSig)) {
      return null
    }

    // Decode payload (works in both environments)
    // base64url decode: replace - with +, _ with /, then decode
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    const payload = JSON.parse(payloadJson) as SessionClaims

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return null
    }

    // Validate structure
    if (!payload.userId || !payload.sessionId || !payload.iat || !payload.exp) {
      return null
    }

    return payload
  } catch (_error) {
    // Invalid token format or JSON parse error
    return null
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}
