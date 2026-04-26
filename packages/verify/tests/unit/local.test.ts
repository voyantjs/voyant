import { describe, expect, it, vi } from "vitest"

import { createLocalVerifyProvider } from "../../src/providers/local.js"

describe("createLocalVerifyProvider", () => {
  it("captures the generated code via the sink and validates it", async () => {
    const sink = vi.fn()
    const provider = createLocalVerifyProvider({
      generateCode: () => "424242",
      sink,
    })

    const attempt = await provider.start({ to: "+40123", channel: "sms" })

    expect(attempt.status).toBe("pending")
    expect(attempt.to).toBe("+40123")
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ code: "424242" }))

    const ok = await provider.check({ to: "+40123", code: "424242" })
    expect(ok.valid).toBe(true)
    expect(ok.status).toBe("approved")

    const replay = await provider.check({ to: "+40123", code: "424242" })
    expect(replay.valid).toBe(false)
  })

  it("rejects mismatched codes without consuming the attempt", async () => {
    const provider = createLocalVerifyProvider({
      generateCode: () => "111111",
      sink: () => {},
    })
    await provider.start({ to: "x@example.com", channel: "email" })

    const wrong = await provider.check({ to: "x@example.com", code: "999999" })
    expect(wrong.valid).toBe(false)
    expect(wrong.status).toBe("pending")

    const ok = await provider.check({ to: "x@example.com", code: "111111" })
    expect(ok.valid).toBe(true)
  })

  it("returns expired when no attempt exists", async () => {
    const provider = createLocalVerifyProvider({ sink: () => {} })
    const result = await provider.check({ to: "missing", code: "123456" })
    expect(result.valid).toBe(false)
    expect(result.status).toBe("expired")
  })
})
