import { describe, expect, it } from "vitest"
import { createR2Presigner } from "../r2-sign.js"

const opts = {
  accountId: "0123456789abcdef0123456789abcdef",
  accessKeyId: "AKIAFAKEFAKEFAKEFAKE",
  secretAccessKey: "fakeSecretKeyfakeSecretKeyfakeSecret",
  bucket: "voyant-bundles",
}

describe("createR2Presigner", () => {
  it("produces an https URL against the R2 account host", async () => {
    const presign = createR2Presigner(opts)
    const url = await presign({ key: "prj_1/v1/container.mjs", expiresIn: 300 })
    expect(url.startsWith("https://")).toBe(true)
    expect(url).toContain(`${opts.accountId}.r2.cloudflarestorage.com`)
    expect(url).toContain("/voyant-bundles/prj_1/v1/container.mjs")
  })

  it("includes the standard SigV4 query parameters", async () => {
    const presign = createR2Presigner(opts)
    const url = new URL(await presign({ key: "prj_1/v1/container.mjs", expiresIn: 900 }))
    expect(url.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256")
    expect(url.searchParams.get("X-Amz-Expires")).toBe("900")
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe("host")
    expect(url.searchParams.get("X-Amz-Credential")).toContain(opts.accessKeyId)
    expect(url.searchParams.get("X-Amz-Credential")).toMatch(/\/auto\/s3\/aws4_request$/)
    // Signature is a 64-char lowercase hex.
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/)
    // X-Amz-Date is YYYYMMDDTHHMMSSZ.
    expect(url.searchParams.get("X-Amz-Date")).toMatch(/^\d{8}T\d{6}Z$/)
  })

  it("url-encodes object keys with slashes + special chars", async () => {
    const presign = createR2Presigner(opts)
    const url = await presign({
      key: "tenant a/v1/container.mjs",
      expiresIn: 60,
    })
    expect(url).toContain("/voyant-bundles/tenant%20a/v1/container.mjs")
  })

  it("strips a leading slash on the key", async () => {
    const presign = createR2Presigner(opts)
    const url = await presign({ key: "/prj_1/v1/container.mjs", expiresIn: 60 })
    // Still just one / between bucket and key.
    expect(url).toContain("/voyant-bundles/prj_1/")
    expect(url).not.toContain("/voyant-bundles//")
  })

  it("rejects out-of-range expiresIn values", async () => {
    const presign = createR2Presigner(opts)
    await expect(presign({ key: "x", expiresIn: 0 })).rejects.toThrow(/expiresIn/)
    await expect(presign({ key: "x", expiresIn: 604_801 })).rejects.toThrow(/expiresIn/)
  })

  it("produces distinct signatures for distinct keys (sanity)", async () => {
    const presign = createR2Presigner(opts)
    const [u1, u2] = await Promise.all([
      presign({ key: "a/v1/container.mjs", expiresIn: 300 }),
      presign({ key: "b/v1/container.mjs", expiresIn: 300 }),
    ])
    const sig1 = new URL(u1).searchParams.get("X-Amz-Signature")
    const sig2 = new URL(u2).searchParams.get("X-Amz-Signature")
    expect(sig1).not.toBe(sig2)
  })
})
