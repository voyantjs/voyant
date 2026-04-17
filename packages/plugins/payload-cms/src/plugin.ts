import type { Plugin, Subscriber } from "@voyantjs/core"

import { createPayloadClient, type PayloadClientOptions } from "./client.js"
import type { PayloadDocBody, VoyantEntityEvent } from "./types.js"

/**
 * Event names the plugin subscribes to. Defaults match the `<resource>.<pastTenseAction>`
 * naming convention documented by the EventBus contract.
 */
export interface PayloadSyncEventNames {
  created?: string
  updated?: string
  deleted?: string
}

/**
 * Mapper from a Voyant event payload (assumed to carry at least `id: string`)
 * to a Payload document body. The `voyantId` field is injected automatically
 * by the client — do not set it here.
 */
export type PayloadMapFn = (event: VoyantEntityEvent) => PayloadDocBody

/**
 * Logger shape used to surface plugin errors without coupling to any specific
 * runtime. Defaults to `console`.
 */
export interface PayloadLogger {
  error: (message: string, meta?: unknown) => void
  info?: (message: string, meta?: unknown) => void
}

export interface PayloadCmsPluginOptions extends PayloadClientOptions {
  /**
   * Payload collection slug to sync Voyant records into (e.g. "products").
   */
  collection: string
  /**
   * Event names this plugin subscribes to. Defaults to
   * `product.created` / `product.updated` / `product.deleted`.
   */
  events?: PayloadSyncEventNames
  /**
   * Map a Voyant event payload into a Payload document body. Defaults to
   * passing through every property except `id` (which becomes `voyantId`).
   */
  mapEvent?: PayloadMapFn
  /** Override logger. Defaults to `console`. */
  logger?: PayloadLogger
}

function defaultMapEvent(event: VoyantEntityEvent): PayloadDocBody {
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
 * Build a Voyant {@link Plugin} that pushes event payloads to a Payload
 * collection as documents, keyed by `voyantId` for idempotent upserts.
 *
 * The plugin subscribes to three events (configurable via
 * {@link PayloadCmsPluginOptions.events}):
 * - `product.created` → upsert document
 * - `product.updated` → upsert document
 * - `product.deleted` → delete document by `voyantId`
 *
 * Errors are caught and logged — subscribers are fire-and-forget per the
 * EventBus contract, so a Payload outage never blocks the emitter.
 */
export function payloadCmsPlugin(options: PayloadCmsPluginOptions): Plugin {
  const client = createPayloadClient(options)
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
      handler: async (envelope) => {
        const event = coerceEvent(envelope.data)
        if (!event) return
        try {
          await client.upsertByVoyantId(options.collection, event.id, mapEvent(event))
        } catch (err) {
          logger.error(
            `[payload-cms] upsert on "${eventNames.created}" failed for ${event.id}`,
            err,
          )
        }
      },
    },
    {
      event: eventNames.updated,
      handler: async (envelope) => {
        const event = coerceEvent(envelope.data)
        if (!event) return
        try {
          await client.upsertByVoyantId(options.collection, event.id, mapEvent(event))
        } catch (err) {
          logger.error(
            `[payload-cms] upsert on "${eventNames.updated}" failed for ${event.id}`,
            err,
          )
        }
      },
    },
    {
      event: eventNames.deleted,
      handler: async (envelope) => {
        const event = coerceEvent(envelope.data)
        if (!event) return
        try {
          await client.deleteByVoyantId(options.collection, event.id)
        } catch (err) {
          logger.error(
            `[payload-cms] delete on "${eventNames.deleted}" failed for ${event.id}`,
            err,
          )
        }
      },
    },
  ]

  return {
    name: "payload-cms",
    version: "0.1.0",
    subscribers,
  }
}
