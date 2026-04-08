/**
 * Minimal AWS SigV4 signing implementation using Web Crypto. Works in
 * Cloudflare Workers, modern Node, Deno, and browsers.
 *
 * Supports two use cases needed by the S3 storage provider:
 * - `signRequest`: attach an `Authorization` header for a direct request
 * - `presignUrl`: produce a time-limited URL via query-string signing
 *
 * Reference:
 * https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv_create-signed-request.html
 */

const encoder = new TextEncoder()

export interface SigV4Credentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

export interface SigV4Context {
  credentials: SigV4Credentials
  region: string
  service: string
}

export interface SignRequestInput extends SigV4Context {
  method: string
  url: string
  headers?: Record<string, string>
  body?: Uint8Array
  /** Override "now" (milliseconds since epoch). Useful for tests. */
  now?: number
}

export interface SignedRequestHeaders {
  headers: Record<string, string>
}

export interface PresignUrlInput extends SigV4Context {
  method: string
  url: string
  expiresIn: number
  /** Extra signed headers beyond the default `host`. */
  headers?: Record<string, string>
  /** Override "now" (milliseconds since epoch). Useful for tests. */
  now?: number
}

/**
 * Sign a request and return the `Authorization` (and related) headers.
 */
export async function signRequest(input: SignRequestInput): Promise<SignedRequestHeaders> {
  const { amzDate, dateStamp } = datesFromNow(input.now)
  const url = new URL(input.url)
  const bodyBytes = input.body ?? new Uint8Array()
  const payloadHash = await hexHash(bodyBytes)

  const baseHeaders: Record<string, string> = {
    ...(input.headers ?? {}),
    host: url.host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  }
  if (input.credentials.sessionToken) {
    baseHeaders["x-amz-security-token"] = input.credentials.sessionToken
  }

  const canonicalQuery = canonicalQueryString(url)
  const { canonicalHeaders, signedHeaders } = canonicalizeHeaders(baseHeaders)
  const canonicalRequest = [
    input.method.toUpperCase(),
    canonicalUri(url.pathname),
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  const scope = `${dateStamp}/${input.region}/${input.service}/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await hexHash(encoder.encode(canonicalRequest)),
  ].join("\n")

  const signingKey = await deriveSigningKey(
    input.credentials.secretAccessKey,
    dateStamp,
    input.region,
    input.service,
  )
  const signature = hex(await hmac(signingKey, stringToSign))

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${input.credentials.accessKeyId}/${scope}` +
    `, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    headers: {
      ...baseHeaders,
      Authorization: authHeader,
    },
  }
}

/**
 * Produce a presigned URL (query-string signing) for the given method.
 */
export async function presignUrl(input: PresignUrlInput): Promise<string> {
  const { amzDate, dateStamp } = datesFromNow(input.now)
  const url = new URL(input.url)
  const scope = `${dateStamp}/${input.region}/${input.service}/aws4_request`

  const headers: Record<string, string> = {
    ...(input.headers ?? {}),
    host: url.host,
  }
  const { canonicalHeaders, signedHeaders } = canonicalizeHeaders(headers)

  const params = new URLSearchParams(url.searchParams)
  params.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256")
  params.set("X-Amz-Credential", `${input.credentials.accessKeyId}/${scope}`)
  params.set("X-Amz-Date", amzDate)
  params.set("X-Amz-Expires", String(input.expiresIn))
  params.set("X-Amz-SignedHeaders", signedHeaders)
  if (input.credentials.sessionToken) {
    params.set("X-Amz-Security-Token", input.credentials.sessionToken)
  }
  url.search = params.toString()

  const canonicalRequest = [
    input.method.toUpperCase(),
    canonicalUri(url.pathname),
    canonicalQueryString(url),
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n")

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await hexHash(encoder.encode(canonicalRequest)),
  ].join("\n")

  const signingKey = await deriveSigningKey(
    input.credentials.secretAccessKey,
    dateStamp,
    input.region,
    input.service,
  )
  const signature = hex(await hmac(signingKey, stringToSign))
  params.set("X-Amz-Signature", signature)
  url.search = params.toString()
  return url.toString()
}

// --- helpers --- //

function datesFromNow(nowMs?: number): { amzDate: string; dateStamp: string } {
  const d = new Date(nowMs ?? Date.now())
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, "")
  // iso is like "20251005T223045Z"
  return { amzDate: iso, dateStamp: iso.slice(0, 8) }
}

function canonicalUri(path: string): string {
  // S3 keys should be path-encoded but preserve "/"
  if (!path) return "/"
  return path
    .split("/")
    .map((segment) => encodeRfc3986(segment))
    .join("/")
}

function canonicalQueryString(url: URL): string {
  const pairs: Array<[string, string]> = []
  for (const [key, value] of url.searchParams.entries()) {
    pairs.push([encodeRfc3986(key), encodeRfc3986(value)])
  }
  pairs.sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
  return pairs.map(([k, v]) => `${k}=${v}`).join("&")
}

function canonicalizeHeaders(headers: Record<string, string>): {
  canonicalHeaders: string
  signedHeaders: string
} {
  const entries = Object.entries(headers)
    .map(([k, v]) => [k.toLowerCase(), v.trim().replace(/\s+/g, " ")] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const canonicalHeaders = `${entries.map(([k, v]) => `${k}:${v}`).join("\n")}\n`
  const signedHeaders = entries.map(([k]) => k).join(";")
  return { canonicalHeaders, signedHeaders }
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

async function hexHash(data: Uint8Array): Promise<string> {
  const copy = new Uint8Array(data.byteLength)
  copy.set(data)
  const digest = await crypto.subtle.digest("SHA-256", copy)
  return hex(digest)
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const source = key instanceof Uint8Array ? key : new Uint8Array(key)
  const keyBytes = new Uint8Array(source.byteLength)
  keyBytes.set(source)
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const payloadSource = encoder.encode(data)
  const payload = new Uint8Array(payloadSource.byteLength)
  payload.set(payloadSource)
  return crypto.subtle.sign("HMAC", cryptoKey, payload)
}

async function deriveSigningKey(
  secret: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmac(encoder.encode(`AWS4${secret}`), dateStamp)
  const kRegion = await hmac(kDate, region)
  const kService = await hmac(kRegion, service)
  const kSigning = await hmac(kService, "aws4_request")
  return kSigning
}

function hex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let out = ""
  for (const b of bytes) {
    out += b.toString(16).padStart(2, "0")
  }
  return out
}
