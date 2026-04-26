/**
 * Unified key parser for charter admin routes.
 *
 * The same admin endpoint (e.g. `GET /v1/admin/charters/products/:key`)
 * accepts both local TypeIDs (`chrt_…`) and external adapter-scoped keys
 * (`<provider>:<ref>`, e.g. `voyant-connect:cnx_xx/extId`). Phase 2 only
 * exercises `kind: 'local'`; external keys return 501 until phase 3 ships
 * the adapter contract. Mirrors the cruises lib/key.ts implementation.
 */

export type ParsedKey =
  | { kind: "local"; id: string }
  | { kind: "external"; provider: string; ref: string }
  | { kind: "invalid"; raw: string }

const TYPEID_RE = /^[a-z]+_[0-9a-zA-Z]+$/

export function parseUnifiedKey(raw: string): ParsedKey {
  const decoded = decodeURIComponent(raw)
  const colon = decoded.indexOf(":")
  if (colon > 0) {
    const provider = decoded.slice(0, colon)
    const ref = decoded.slice(colon + 1)
    if (provider && ref) return { kind: "external", provider, ref }
    return { kind: "invalid", raw: decoded }
  }
  if (TYPEID_RE.test(decoded)) return { kind: "local", id: decoded }
  return { kind: "invalid", raw: decoded }
}
