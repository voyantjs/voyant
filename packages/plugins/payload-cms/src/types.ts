/**
 * Minimal shape Voyant events expose when carrying a record identifier.
 * The plugin accepts anything with `id: string`; everything else is passed
 * through to `mapProduct` untouched.
 */
export interface VoyantEntityEvent {
  id: string
  [key: string]: unknown
}

/**
 * A Payload document, as a bag of properties. Payload always assigns its own
 * `id`; the plugin additionally sets a `voyantId` (configurable) for
 * idempotent lookups.
 */
export type PayloadDocBody = Record<string, unknown>

/**
 * Minimal `fetch` shape the Payload client depends on. Works with the global
 * `fetch` in Node 18+ / Cloudflare Workers / browsers, and is trivially
 * stubbable in tests.
 */
export type PayloadFetch = (
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
