import { describe, expect, it } from "vitest"

import { presignUrl, signRequest } from "../../src/lib/sigv4.js"

// AWS-published reference credentials for SigV4 test vectors.
// Source: https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
const credentials = {
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
}
const region = "us-east-1"
const service = "s3"
// 2013-05-24T00:00:00.000Z
const FIXED_NOW = Date.UTC(2013, 4, 24, 0, 0, 0, 0)

describe("signRequest (SigV4 header signing)", () => {
  it("matches AWS's canonical GET Object test vector", async () => {
    const result = await signRequest({
      method: "GET",
      url: "https://examplebucket.s3.amazonaws.com/test.txt",
      headers: { range: "bytes=0-9" },
      credentials,
      region,
      service,
      now: FIXED_NOW,
    })
    expect(result.headers.Authorization).toBe(
      "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request" +
        ", SignedHeaders=host;range;x-amz-content-sha256;x-amz-date" +
        ", Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41",
    )
    expect(result.headers["x-amz-date"]).toBe("20130524T000000Z")
    expect(result.headers["x-amz-content-sha256"]).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    expect(result.headers.host).toBe("examplebucket.s3.amazonaws.com")
  })

  it("is deterministic for fixed inputs", async () => {
    const input = {
      method: "PUT",
      url: "https://bucket.s3.amazonaws.com/key.txt",
      body: new TextEncoder().encode("hello"),
      credentials,
      region,
      service,
      now: FIXED_NOW,
    }
    const a = await signRequest(input)
    const b = await signRequest(input)
    expect(a.headers.Authorization).toBe(b.headers.Authorization)
  })

  it("produces different signatures when the body changes", async () => {
    const base = {
      method: "PUT",
      url: "https://bucket.s3.amazonaws.com/key.txt",
      credentials,
      region,
      service,
      now: FIXED_NOW,
    }
    const a = await signRequest({ ...base, body: new TextEncoder().encode("one") })
    const b = await signRequest({ ...base, body: new TextEncoder().encode("two") })
    expect(a.headers.Authorization).not.toBe(b.headers.Authorization)
  })

  it("includes x-amz-security-token when session token is present", async () => {
    const result = await signRequest({
      method: "GET",
      url: "https://bucket.s3.amazonaws.com/key",
      credentials: { ...credentials, sessionToken: "session-123" },
      region,
      service,
      now: FIXED_NOW,
    })
    expect(result.headers["x-amz-security-token"]).toBe("session-123")
    expect(result.headers.Authorization).toContain("x-amz-security-token")
  })
})

describe("presignUrl", () => {
  it("produces a signed URL containing the expected query params", async () => {
    const url = await presignUrl({
      method: "GET",
      url: "https://examplebucket.s3.amazonaws.com/test.txt",
      expiresIn: 86400,
      credentials,
      region,
      service,
      now: FIXED_NOW,
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256")
    expect(parsed.searchParams.get("X-Amz-Credential")).toBe(
      "AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request",
    )
    expect(parsed.searchParams.get("X-Amz-Date")).toBe("20130524T000000Z")
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("86400")
    expect(parsed.searchParams.get("X-Amz-SignedHeaders")).toBe("host")
    expect(parsed.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/)
  })

  it("matches AWS's canonical presigned URL test vector", async () => {
    const url = await presignUrl({
      method: "GET",
      url: "https://examplebucket.s3.amazonaws.com/test.txt",
      expiresIn: 86400,
      credentials,
      region,
      service,
      now: FIXED_NOW,
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get("X-Amz-Signature")).toBe(
      "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404",
    )
  })

  it("is deterministic for fixed inputs", async () => {
    const input = {
      method: "GET",
      url: "https://bucket.s3.amazonaws.com/key.txt",
      expiresIn: 3600,
      credentials,
      region,
      service,
      now: FIXED_NOW,
    }
    const a = await presignUrl(input)
    const b = await presignUrl(input)
    expect(a).toBe(b)
  })
})
