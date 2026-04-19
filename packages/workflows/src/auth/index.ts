// @voyantjs/workflows/auth
//
// Paired HMAC signer + verifier for the `X-Voyant-Dispatch-Auth`
// header on `POST /__voyant/workflow-step`. Both sides share a
// symmetric secret — suitable for local dev and single-region
// deployments; asymmetric signing (control-plane issuer + tenant
// public-key) is a later upgrade that keeps the same header shape.
//
// Built on Web Crypto (`crypto.subtle`), so it works unchanged in
// Node 20+, Cloudflare Workers, Deno, Bun, and browsers.
//
// Usage on the orchestrator side:
//
//   import { createHmacSigner } from "@voyantjs/workflows/auth";
//   const sign = await createHmacSigner(process.env.VOYANT_SIGNING_KEY!);
//   createDispatchStepHandler(script, { dispatcher, sign });
//
// Usage on the tenant side:
//
//   import { createHmacVerifier } from "@voyantjs/workflows/auth";
//   import { createStepHandler } from "@voyantjs/workflows/handler";
//   const verify = await createHmacVerifier(env.VOYANT_SIGNING_KEY);
//   export default { fetch: createStepHandler({ verifyRequest: verify }) };

export const AUTH_HEADER = "x-voyant-dispatch-auth" as const

/**
 * Returns a verifier that accepts `Authorization: Bearer <token>`
 * where `<token>` matches any of the `validTokens` (case-sensitive,
 * constant-time compared). Usable as the `verifyRequest` dep on
 * `handleWorkerRequest` / `createStepHandler` for the public-facing
 * surface of an orchestrator or tenant Worker.
 *
 * Intended for dev + single-tenant deployments. Production should
 * issue per-tenant, short-lived tokens from a control plane.
 */
export function createBearerVerifier(validTokens: readonly string[]): (req: Request) => void {
  if (validTokens.length === 0) {
    throw new Error("createBearerVerifier: need at least one valid token")
  }
  return (req) => {
    const header = req.headers.get("authorization")
    if (!header) throw new Error("missing Authorization header")
    const match = /^Bearer (.+)$/.exec(header)
    if (!match) {
      throw new Error("Authorization header must use the Bearer scheme")
    }
    const presented = match[1]!
    for (const valid of validTokens) {
      if (constantTimeEquals(presented, valid)) return
    }
    throw new Error("bearer token does not match any configured value")
  }
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** Returns a signer: `(body: string) => Promise<string>` (base64 HMAC-SHA256). */
export async function createHmacSigner(secret: string): Promise<(body: string) => Promise<string>> {
  const key = await importKey(secret, ["sign"])
  return async (body) => {
    const sig = await crypto.subtle.sign("HMAC", key, encode(body))
    return toBase64(sig)
  }
}

/**
 * Returns a verifier: `(req: Request) => Promise<void>`. Throws if:
 *   - the header is missing,
 *   - the signature is malformed,
 *   - the signature does not match the current body.
 *
 * The verifier consumes `req.body` via `req.text()`. Callers that
 * need the body downstream should pre-clone: `req.clone()` before
 * passing in.
 */
export async function createHmacVerifier(secret: string): Promise<(req: Request) => Promise<void>> {
  const key = await importKey(secret, ["verify"])
  return async (req) => {
    const header = req.headers.get(AUTH_HEADER)
    if (!header) {
      throw new Error(`missing ${AUTH_HEADER} header`)
    }
    let sig: ArrayBuffer
    try {
      sig = fromBase64(header)
    } catch {
      throw new Error(`malformed ${AUTH_HEADER} header (expected base64)`)
    }
    const body = await req.clone().text()
    const ok = await crypto.subtle.verify("HMAC", key, sig, encode(body))
    if (!ok) {
      throw new Error(`${AUTH_HEADER} signature does not match request body`)
    }
  }
}

// ---- Internals ----

async function importKey(
  secret: string,
  usages: readonly ("sign" | "verify")[],
): Promise<CryptoKey> {
  if (secret.length === 0) {
    throw new Error("HMAC secret must be a non-empty string")
  }
  return crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages as KeyUsage[],
  )
}

/**
 * Encode to a freshly-allocated ArrayBuffer. TextEncoder's Uint8Array
 * is typed as `Uint8Array<ArrayBufferLike>` under recent TS lib, which
 * doesn't satisfy the `BufferSource` param of `subtle.sign/verify`.
 * Copying into a new ArrayBuffer sidesteps the nominal mismatch.
 */
function encode(s: string): ArrayBuffer {
  const view = new TextEncoder().encode(s)
  const buf = new ArrayBuffer(view.byteLength)
  new Uint8Array(buf).set(view)
  return buf
}

function toBase64(buffer: ArrayBuffer): string {
  // btoa is available in every modern runtime (Node 16+, Workers, browsers).
  const bytes = new Uint8Array(buffer)
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin)
}

function fromBase64(s: string): ArrayBuffer {
  const bin = atob(s)
  const buf = new ArrayBuffer(bin.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
  return buf
}
