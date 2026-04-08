import { describe, expect, it, vi } from "vitest"

import type { S3Fetch } from "../../src/providers/s3.js"
import { createS3Provider } from "../../src/providers/s3.js"

function okResponse(body?: Uint8Array) {
  const bytes = body ?? new Uint8Array()
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => bytes.buffer.slice(0),
    text: async () => new TextDecoder().decode(bytes),
  }
}

function statusResponse(status: number, text = "") {
  return {
    ok: status >= 200 && status < 300,
    status,
    arrayBuffer: async () => new ArrayBuffer(0),
    text: async () => text,
  }
}

const baseOptions = {
  accessKeyId: "AKIA-TEST",
  secretAccessKey: "secret-test",
  region: "us-east-1",
  bucket: "my-bucket",
}

describe("createS3Provider", () => {
  it("uploads with path-style URLs by default", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => okResponse())
    const provider = createS3Provider({
      ...baseOptions,
      fetch: fetchMock,
      generateKey: () => "docs/file.txt",
    })
    await provider.upload(new Uint8Array([1, 2, 3]), { contentType: "text/plain" })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://s3.us-east-1.amazonaws.com/my-bucket/docs/file.txt")
    expect(init.method).toBe("PUT")
    expect(init.headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 /)
    expect(init.headers["content-type"]).toBe("text/plain")
  })

  it("uses virtual-hosted style URLs when forcePathStyle is false", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => okResponse())
    const provider = createS3Provider({
      ...baseOptions,
      forcePathStyle: false,
      fetch: fetchMock,
      generateKey: () => "a.png",
    })
    await provider.upload(new Uint8Array([1]))
    const [url] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://my-bucket.s3.us-east-1.amazonaws.com/a.png")
  })

  it("honors a custom endpoint (S3-compatible services)", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => okResponse())
    const provider = createS3Provider({
      ...baseOptions,
      endpoint: "https://s3.wasabisys.com",
      fetch: fetchMock,
      generateKey: () => "k",
    })
    await provider.upload(new Uint8Array([1]))
    const [url] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://s3.wasabisys.com/my-bucket/k")
  })

  it("adds x-amz-meta-* headers for custom metadata", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => okResponse())
    const provider = createS3Provider({
      ...baseOptions,
      fetch: fetchMock,
      generateKey: () => "k",
    })
    await provider.upload(new Uint8Array([1]), {
      metadata: { owner: "mihai", tag: "hero-image" },
    })
    const init = fetchMock.mock.calls[0]![1]
    expect(init.headers["x-amz-meta-owner"]).toBe("mihai")
    expect(init.headers["x-amz-meta-tag"]).toBe("hero-image")
  })

  it("throws when upload receives a non-2xx response", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => statusResponse(403, "Forbidden"))
    const provider = createS3Provider({
      ...baseOptions,
      fetch: fetchMock,
      generateKey: () => "k",
    })
    await expect(provider.upload(new Uint8Array([1]))).rejects.toThrow(/S3 upload failed \(403\)/)
  })

  it("deletes an object via a signed DELETE", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => statusResponse(204))
    const provider = createS3Provider({ ...baseOptions, fetch: fetchMock })
    await provider.delete("k")
    const [, init] = fetchMock.mock.calls[0]!
    expect(init.method).toBe("DELETE")
    expect(init.headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 /)
  })

  it("treats a 404 on delete as success", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => statusResponse(404, "Not Found"))
    const provider = createS3Provider({ ...baseOptions, fetch: fetchMock })
    await expect(provider.delete("missing")).resolves.toBeUndefined()
  })

  it("get returns the object bytes", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => okResponse(new Uint8Array([9, 8, 7])))
    const provider = createS3Provider({ ...baseOptions, fetch: fetchMock })
    const bytes = await provider.get("k")
    expect(bytes).not.toBeNull()
    expect(new Uint8Array(bytes as ArrayBuffer)).toEqual(new Uint8Array([9, 8, 7]))
  })

  it("get returns null on 404", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => statusResponse(404))
    const provider = createS3Provider({ ...baseOptions, fetch: fetchMock })
    expect(await provider.get("missing")).toBeNull()
  })

  it("signedUrl produces a presigned GET URL", async () => {
    const provider = createS3Provider({ ...baseOptions })
    const url = await provider.signedUrl("docs/file.txt", 3600)
    const parsed = new URL(url)
    expect(parsed.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256")
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("3600")
    expect(parsed.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/)
    expect(parsed.pathname).toBe("/my-bucket/docs/file.txt")
  })

  it("publicBaseUrl sets the returned URL from upload", async () => {
    const fetchMock = vi.fn<S3Fetch>(async () => okResponse())
    const provider = createS3Provider({
      ...baseOptions,
      fetch: fetchMock,
      publicBaseUrl: "https://cdn.example.com/",
      generateKey: () => "k",
    })
    const result = await provider.upload(new Uint8Array([1]))
    expect(result.url).toBe("https://cdn.example.com/k")
  })
})
