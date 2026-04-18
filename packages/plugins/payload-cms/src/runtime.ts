import { createPayloadClient } from "./client.js"
import type { PayloadCmsPluginOptions, PayloadLogger, PayloadMapFn } from "./plugin.js"
import type { PayloadDocBody, VoyantEntityEvent } from "./types.js"

export interface ResolvedPayloadSyncEventNames {
  created: string
  updated: string
  deleted: string
}

export interface PayloadSyncRuntime {
  client: ReturnType<typeof createPayloadClient>
  logger: PayloadLogger
  mapEvent: PayloadMapFn
  eventNames: ResolvedPayloadSyncEventNames
}

function defaultMapEvent(event: VoyantEntityEvent): PayloadDocBody {
  const { id: _id, ...rest } = event
  return rest
}

export function createPayloadSyncRuntime(options: PayloadCmsPluginOptions): PayloadSyncRuntime {
  return {
    client: createPayloadClient(options),
    logger: options.logger ?? console,
    mapEvent: options.mapEvent ?? defaultMapEvent,
    eventNames: {
      created: options.events?.created ?? "product.created",
      updated: options.events?.updated ?? "product.updated",
      deleted: options.events?.deleted ?? "product.deleted",
    },
  }
}
