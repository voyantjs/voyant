// AWS SigV4 presigned URL generator for Cloudflare R2.
//
// R2 speaks S3, so any valid SigV4-GetObject presigned URL works.
// We hand-roll the signer (Web Crypto + fetch only) so the tenant
// Worker doesn't need the AWS SDK — which is heavy enough to matter
// on Workers' bundle-size limits.
//
// Usage on the orchestrator side:
//
//   const presign = createR2Presigner({
//     accountId: env.R2_ACCOUNT_ID,
//     accessKeyId: env.R2_ACCESS_KEY_ID,
//     secretAccessKey: env.R2_SECRET_ACCESS_KEY,
//     bucket: "voyant-bundles",
//   });
//   const url = await presign({ key: "prj_1/v1/container.mjs", expiresIn: 300 });

export interface R2PresignerOptions {
  /** Cloudflare account id (32-char hex). */
  accountId: string
  /** R2 Access Key ID from your CF dashboard — scope read-only. */
  accessKeyId: string
  /** R2 Secret Access Key. Store as a Worker Secret. */
  secretAccessKey: string
  /** R2 bucket name. */
  bucket: string
}

export interface PresignArgs {
  /** Object key, e.g. `"prj_42/v1/container.mjs"`. Leading `/` is optional. */
  key: string
  /** Seconds until the URL stops being valid. Min 1, max 604800. */
  expiresIn: number
}

export function createR2Presigner(
  opts: R2PresignerOptions,
): (args: PresignArgs) => Promise<string> {
  const host = `${opts.accountId}.r2.cloudflarestorage.com`
  const region = "auto" // R2's SigV4 region convention.
  const service = "s3"

  return async ({ key, expiresIn }) => {
    if (expiresIn < 1 || expiresIn > 604_800) {
      throw new Error(`R2 presign: expiresIn must be 1..604800, got ${expiresIn}`)
    }
    const normalizedKey = key.replace(/^\/+/, "")
    const encodedKey = normalizedKey
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/")

    const now = new Date()
    const amzDate = toAmzDate(now)
    const shortDate = amzDate.slice(0, 8)
    const credentialScope = `${shortDate}/${region}/${service}/aws4_request`
    const credential = `${opts.accessKeyId}/${credentialScope}`

    const params: Array<[string, string]> = [
      ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
      ["X-Amz-Credential", credential],
      ["X-Amz-Date", amzDate],
      ["X-Amz-Expires", String(expiresIn)],
      ["X-Amz-SignedHeaders", "host"],
    ]
    params.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    const canonicalQuery = params
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&")

    const canonicalRequest = [
      "GET",
      `/${opts.bucket}/${encodedKey}`,
      canonicalQuery,
      `host:${host}\n`,
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n")

    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await sha256Hex(canonicalRequest),
    ].join("\n")

    const signingKey = await deriveSigningKey(opts.secretAccessKey, shortDate, region, service)
    const signature = toHex(await hmac(signingKey, stringToSign))

    return `https://${host}/${opts.bucket}/${encodedKey}?${canonicalQuery}&X-Amz-Signature=${signature}`
  }
}

// ---- Crypto helpers ----

function toAmzDate(d: Date): string {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const hh = String(d.getUTCHours()).padStart(2, "0")
  const mi = String(d.getUTCMinutes()).padStart(2, "0")
  const ss = String(d.getUTCSeconds()).padStart(2, "0")
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`
}

function toHex(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes)
  let out = ""
  for (const b of arr) out += b.toString(16).padStart(2, "0")
  return out
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return toHex(digest)
}

async function hmac(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  const keyBuf = key instanceof Uint8Array ? key.slice().buffer : key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(msg))
}

async function deriveSigningKey(
  secret: string,
  shortDate: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmac(new TextEncoder().encode(`AWS4${secret}`), shortDate)
  const kRegion = await hmac(kDate, region)
  const kService = await hmac(kRegion, service)
  const kSigning = await hmac(kService, "aws4_request")
  return kSigning
}
