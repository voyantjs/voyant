import { describe, expect, it } from "vitest"

import { parseUnifiedKey } from "../../src/lib/key.js"

describe("parseUnifiedKey — local TypeIDs", () => {
  it("parses a standard cruise TypeID", () => {
    const result = parseUnifiedKey("cru_01HMABCDEF12345678")
    expect(result).toEqual({ kind: "local", id: "cru_01HMABCDEF12345678" })
  })

  it("parses a sailing TypeID", () => {
    const result = parseUnifiedKey("crsl_xyzZYX")
    expect(result).toEqual({ kind: "local", id: "crsl_xyzZYX" })
  })

  it("accepts mixed case in the suffix", () => {
    const result = parseUnifiedKey("cru_AbCdEf")
    expect(result).toEqual({ kind: "local", id: "cru_AbCdEf" })
  })
})

describe("parseUnifiedKey — external adapter keys", () => {
  it("parses voyant-connect provider", () => {
    const result = parseUnifiedKey("voyant-connect:cnx_abc123")
    expect(result).toEqual({ kind: "external", provider: "voyant-connect", ref: "cnx_abc123" })
  })

  it("preserves additional colons in the ref", () => {
    const result = parseUnifiedKey("custom:cnx_abc:vendor:xyz")
    expect(result).toEqual({ kind: "external", provider: "custom", ref: "cnx_abc:vendor:xyz" })
  })

  it("parses a custom provider", () => {
    const result = parseUnifiedKey("custom:supplier-feed-xyz")
    expect(result).toEqual({ kind: "external", provider: "custom", ref: "supplier-feed-xyz" })
  })

  it("decodes URI-encoded refs", () => {
    const result = parseUnifiedKey("voyant-connect%3Acnx_abc")
    expect(result).toEqual({ kind: "external", provider: "voyant-connect", ref: "cnx_abc" })
  })
})

describe("parseUnifiedKey — invalid keys", () => {
  it("rejects bare numeric strings", () => {
    expect(parseUnifiedKey("12345")).toEqual({ kind: "invalid", raw: "12345" })
  })

  it("rejects keys with no underscore (TypeID malformed)", () => {
    expect(parseUnifiedKey("cruabc")).toEqual({ kind: "invalid", raw: "cruabc" })
  })

  it("rejects empty string", () => {
    expect(parseUnifiedKey("")).toEqual({ kind: "invalid", raw: "" })
  })

  it("rejects external key with empty provider", () => {
    expect(parseUnifiedKey(":cnx_abc")).toEqual({ kind: "invalid", raw: ":cnx_abc" })
  })

  it("rejects external key with empty ref", () => {
    expect(parseUnifiedKey("voyant-connect:")).toEqual({
      kind: "invalid",
      raw: "voyant-connect:",
    })
  })

  it("rejects TypeID with non-alphanumeric suffix chars", () => {
    expect(parseUnifiedKey("cru_abc-def")).toEqual({ kind: "invalid", raw: "cru_abc-def" })
  })
})
