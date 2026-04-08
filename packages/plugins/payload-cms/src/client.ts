import type { PayloadDocBody, PayloadFetch } from "./types.js"

/**
 * Options for {@link createPayloadClient}.
 */
export interface PayloadClientOptions {
  /**
   * Base URL of the Payload REST API including `/api` suffix.
   * Example: `"https://cms.example.com/api"`.
   */
  apiUrl: string
  /** Payload API key. Sent as `Authorization: ${apiKeyHeader} API-Key ${apiKey}`. */
  apiKey: string
  /**
   * Field on the Payload collection that stores the Voyant record's ID.
   * Defaults to `"voyantId"`. The Payload collection must declare this
   * field (unique recommended).
   */
  voyantIdField?: string
  /**
   * Header used to carry the API key. Defaults to `"users API-Key"` which
   * matches Payload's default `users` auth collection. Override if your
   * Payload deployment uses a different auth collection.
   */
  apiKeyAuthScheme?: string
  /** Override `fetch` (e.g. in tests). Defaults to global `fetch`. */
  fetch?: PayloadFetch
}

/**
 * Result of a Payload "find" query, scoped to the fields the client reads.
 */
interface PayloadFindResponse {
  docs?: Array<{ id: string; [key: string]: unknown }>
  totalDocs?: number
}

export interface PayloadClient {
  /**
   * Create or update a document whose {@link PayloadClientOptions.voyantIdField}
   * equals `voyantId`.
   */
  upsertByVoyantId(
    collection: string,
    voyantId: string,
    body: PayloadDocBody,
  ): Promise<{ id: string; created: boolean }>
  /**
   * Delete a document whose `voyantId` field equals the given value. Returns
   * `false` if no matching document was found.
   */
  deleteByVoyantId(collection: string, voyantId: string): Promise<boolean>
  /** Find at most one document whose `voyantId` field equals the given value. */
  findByVoyantId(collection: string, voyantId: string): Promise<{ id: string } | null>
}

export function createPayloadClient(options: PayloadClientOptions): PayloadClient {
  const voyantIdField = options.voyantIdField ?? "voyantId"
  const authScheme = options.apiKeyAuthScheme ?? "users API-Key"
  const apiUrl = options.apiUrl.replace(/\/$/, "")
  const fetchImpl = options.fetch ?? (globalThis.fetch as unknown as PayloadFetch | undefined)

  function headers(): Record<string, string> {
    return {
      Authorization: `${authScheme} ${options.apiKey}`,
      "Content-Type": "application/json",
    }
  }

  async function request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
    if (!fetchImpl) {
      throw new Error("Payload client requires a fetch implementation")
    }
    const init: { method: string; headers: Record<string, string>; body?: string } = {
      method,
      headers: headers(),
    }
    if (body !== undefined) init.body = JSON.stringify(body)
    const response = await fetchImpl(`${apiUrl}${path}`, init)
    // Payload sends JSON for all 2xx/4xx; pull both eagerly.
    let text = ""
    let json: unknown = null
    try {
      text = await response.text()
      json = text ? JSON.parse(text) : null
    } catch {
      // leave json as null, surface text
    }
    return { ok: response.ok, status: response.status, json, text }
  }

  async function findByVoyantId(
    collection: string,
    voyantId: string,
  ): Promise<{ id: string } | null> {
    const query = `where[${encodeURIComponent(voyantIdField)}][equals]=${encodeURIComponent(voyantId)}&limit=1&depth=0`
    const res = await request("GET", `/${collection}?${query}`)
    if (!res.ok) {
      throw new Error(`Payload findByVoyantId(${collection}) failed (${res.status}): ${res.text}`)
    }
    const body = (res.json ?? {}) as PayloadFindResponse
    const first = body.docs?.[0]
    if (!first) return null
    return { id: first.id }
  }

  async function upsertByVoyantId(
    collection: string,
    voyantId: string,
    body: PayloadDocBody,
  ): Promise<{ id: string; created: boolean }> {
    const existing = await findByVoyantId(collection, voyantId)
    const fullBody: PayloadDocBody = { ...body, [voyantIdField]: voyantId }
    if (existing) {
      const res = await request("PATCH", `/${collection}/${existing.id}`, fullBody)
      if (!res.ok) {
        throw new Error(
          `Payload update(${collection}/${existing.id}) failed (${res.status}): ${res.text}`,
        )
      }
      return { id: existing.id, created: false }
    }
    const res = await request("POST", `/${collection}`, fullBody)
    if (!res.ok) {
      throw new Error(`Payload create(${collection}) failed (${res.status}): ${res.text}`)
    }
    const json = (res.json ?? {}) as { doc?: { id?: string }; id?: string }
    const id = json.doc?.id ?? json.id
    if (!id) {
      throw new Error(`Payload create(${collection}) response missing id`)
    }
    return { id, created: true }
  }

  async function deleteByVoyantId(collection: string, voyantId: string): Promise<boolean> {
    const existing = await findByVoyantId(collection, voyantId)
    if (!existing) return false
    const res = await request("DELETE", `/${collection}/${existing.id}`)
    if (!res.ok && res.status !== 404) {
      throw new Error(
        `Payload delete(${collection}/${existing.id}) failed (${res.status}): ${res.text}`,
      )
    }
    return true
  }

  return { upsertByVoyantId, deleteByVoyantId, findByVoyantId }
}
