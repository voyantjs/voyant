import { beforeEach, describe, expect, it } from "vitest"
import { runWorkflowForTest } from "../../testing/index.js"
import { __resetRegistry, workflow } from "../../workflow.js"

beforeEach(() => {
  __resetRegistry()
})

describe("ctx.waitForToken", () => {
  it("returns a tokenId + url and resolves with the harness fixture payload", async () => {
    let capturedTokenId = ""
    let capturedUrl = ""

    const wf = workflow<void, { approved: boolean; reviewer: string }>({
      id: "token.basic",
      async run(_, ctx) {
        const token = await ctx.waitForToken<{ approved: boolean; reviewer: string }>({
          tokenId: "approval-req-42",
        })
        capturedTokenId = token.tokenId
        capturedUrl = token.url
        const payload = await token.wait()
        return payload ?? { approved: false, reviewer: "" }
      },
    })

    const result = await runWorkflowForTest(wf, undefined, {
      waitForToken: {
        "approval-req-42": { approved: true, reviewer: "alice" },
      },
    })

    expect(result.status).toBe("completed")
    expect(result.output).toEqual({ approved: true, reviewer: "alice" })
    expect(capturedTokenId).toBe("approval-req-42")
    expect(capturedUrl).toBe("/__voyant/tokens/approval-req-42")
    // Tokens block body execution, so we go through one yield cycle.
    expect(result.invocations).toBe(2)
  })

  it("auto-generates a tokenId when none is provided", async () => {
    const wf = workflow<void, string>({
      id: "token.auto-id",
      async run(_, ctx) {
        const token = await ctx.waitForToken<string>()
        return token.tokenId
      },
    })

    const result = await runWorkflowForTest(wf, undefined, {
      // tokenId defaults to "tok_<n>"; fixture keyed accordingly.
      waitForToken: { tok_1: "ignored" },
    })

    expect(result.status).toBe("completed")
    expect(result.output).toMatch(/^tok_/)
  })

  it("throws when the harness has no fixture for the token", async () => {
    const wf = workflow<void, unknown>({
      id: "token.missing",
      async run(_, ctx) {
        const t = await ctx.waitForToken({ tokenId: "never-completed" })
        return await t.wait()
      },
    })

    await expect(runWorkflowForTest(wf, undefined)).rejects.toThrow(/no fixture resolution/i)
  })

  it("supports multiple independent tokens in the same run", async () => {
    const wf = workflow<void, { a: string; b: string }>({
      id: "token.multi",
      async run(_, ctx) {
        const t1 = await ctx.waitForToken<string>({ tokenId: "doc-review" })
        const t2 = await ctx.waitForToken<string>({ tokenId: "legal-review" })
        const a = await t1.wait()
        const b = await t2.wait()
        return { a: a ?? "", b: b ?? "" }
      },
    })

    const result = await runWorkflowForTest(wf, undefined, {
      waitForToken: {
        "doc-review": "approved",
        "legal-review": "signed",
      },
    })

    expect(result.status).toBe("completed")
    expect(result.output).toEqual({ a: "approved", b: "signed" })
  })
})
