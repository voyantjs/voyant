import type { Plugin, Subscriber } from "@voyantjs/core"

import { createSanityClient, type SanityClientOptions } from "./client.js"
import type { SanityDocBody, VoyantEntityEvent } from "./types.js"

/**
 * Event names the plugin subscribes to. Defaults match the
 * `<resource>.<pastTenseAction>` naming convention documented by the
 * EventBus contract.
 */
export interface SanitySyncEventNames {
  created?: string
  updated?: string
  deleted?: string
}

/**
 * Mapper from a Voyant event payload (assumed to carry at least `id: string`)
 * to a Sanity document body. The `voyantId` field + `_type` are injected
 * automatically by the client — do not set either here.
 */
export type SanityMapFn = (event: VoyantEntityEvent) => SanityDocBody

/**
 * Logger shape used to surface plugin errors without coupling to any specific
 * runtime. Defaults to `console`.
 */
export interface SanityLogger {
  error: (message: string, meta?: unknown) => void
  info?: (message: string, meta?: unknown) => void
}

export interface SanityCmsPluginOptions extends SanityClientOptions {
  /**
   * Sanity document type to sync Voyant records into (e.g. `"product"`).
   * Equivalent to a Payload collection / content model.
   */
  documentType: string
  /**
   * Event names this plugin subscribes to. Defaults to
   * `product.created` / `product.updated` / `product.deleted`.
   */
  events?: SanitySyncEventNames
  /**
   * Map a Voyant event payload into a Sanity document body. Defaults to
   * passing through every property except `id` (which becomes `voyantId`).
   */
  mapEvent?: SanityMapFn
  /** Override logger. Defaults to `console`. */
  logger?: SanityLogger
}

function defaultMapEvent(event: VoyantEntityEvent): SanityDocBody {
  const { id: _id, ...rest } = event
  return rest
}

function coerceEvent(data: unknown): VoyantEntityEvent | null {
  if (data == null || typeof data !== "object") return null
  const maybe = data as Record<string, unknown>
  if (typeof maybe.id !== "string") return null
  return maybe as VoyantEntityEvent
}

/**
 * Build a Voyant {@link Plugin} that pushes event payloads to a Sanity
 * document type, keyed by `voyantId` for idempotent upserts.
 *
 * The plugin subscribes to three events (configurable via
 * {@link SanityCmsPluginOptions.events}):
 * - `product.created` → upsert document
 * - `product.updated` → upsert document
 * - `product.deleted` → delete document by `voyantId`
 *
 * Errors are caught and logged — subscribers are fire-and-forget per the
 * EventBus contract, so a Sanity outage never blocks the emitter.
 */
export function sanityCmsPlugin(options: SanityCmsPluginOptions): Plugin {
  const client = createSanityClient(options)
  const mapEvent = options.mapEvent ?? defaultMapEvent
  const logger = options.logger ?? console
  const eventNames = {
    created: options.events?.created ?? "product.created",
    updated: options.events?.updated ?? "product.updated",
    deleted: options.events?.deleted ?? "product.deleted",
  }

  const subscribers: Subscriber[] = [
    {
      event: eventNames.created,
      handler: async (data) => {
        const event = coerceEvent(data)
        if (!event) return
        try {
          await client.upsertByVoyantId(options.documentType, event.id, mapEvent(event))
        } catch (err) {
          logger.error(`[sanity-cms] upsert on "${eventNames.created}" failed for ${event.id}`, err)
        }
      },
    },
    {
      event: eventNames.updated,
      handler: async (data) => {
        const event = coerceEvent(data)
        if (!event) return
        try {
          await client.upsertByVoyantId(options.documentType, event.id, mapEvent(event))
        } catch (err) {
          logger.error(`[sanity-cms] upsert on "${eventNames.updated}" failed for ${event.id}`, err)
        }
      },
    },
    {
      event: eventNames.deleted,
      handler: async (data) => {
        const event = coerceEvent(data)
        if (!event) return
        try {
          await client.deleteByVoyantId(options.documentType, event.id)
        } catch (err) {
          logger.error(`[sanity-cms] delete on "${eventNames.deleted}" failed for ${event.id}`, err)
        }
      },
    },
  ]

  return {
    name: "sanity-cms",
    version: "0.1.0",
    subscribers,
  }
}
