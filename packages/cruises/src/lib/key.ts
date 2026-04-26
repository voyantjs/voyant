/**
 * Unified key parser for cruise admin routes.
 *
 * The same admin endpoint (e.g. `GET /v1/admin/cruises/:key`) accepts both
 * local TypeIDs (`cru_abc123…`) and external adapter-scoped keys
 * (`<provider>:<ref>`, e.g. `voyant-connect:cnx_xx/extId`). The parser
 * normalises the URL parameter into a discriminated union so route handlers
 * can dispatch to the local DB or to an adapter.
 *
 * Phase 2 only handles `kind: 'local'`; external keys return 501. Phase 3
 * wires the adapter contract.
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
