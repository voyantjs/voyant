/**
 * Minimal shape Voyant events expose when carrying a record identifier.
 * The plugin accepts anything with `id: string`; everything else is passed
 * through to `mapEvent` untouched.
 */
export interface VoyantEntityEvent {
  id: string
  [key: string]: unknown
}

/**
 * A Sanity document body, as a bag of properties. Sanity assigns `_id` +
 * `_type` on creation; the plugin sets a `voyantId` field (configurable)
 * for idempotent lookups.
 */
export type SanityDocBody = Record<string, unknown>

/**
 * Minimal `fetch` shape the Sanity client depends on. Works with the global
 * `fetch` in Node 18+ / Cloudflare Workers / browsers, and is trivially
 * stubbable in tests.
 */
export type SanityFetch = (
  input: string,
  init: {
    method: string
    headers: Record<string, string>
    body?: string
  },
) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
  text: () => Promise<string>
}>
