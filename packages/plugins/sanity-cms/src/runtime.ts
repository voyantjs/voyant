import { createSanityClient } from "./client.js"
import type { SanityCmsPluginOptions, SanityLogger, SanityMapFn } from "./plugin.js"
import type { SanityDocBody, VoyantEntityEvent } from "./types.js"

export interface ResolvedSanitySyncEventNames {
  created: string
  updated: string
  deleted: string
}

export interface SanitySyncRuntime {
  client: ReturnType<typeof createSanityClient>
  logger: SanityLogger
  mapEvent: SanityMapFn
  eventNames: ResolvedSanitySyncEventNames
}

function defaultMapEvent(event: VoyantEntityEvent): SanityDocBody {
  const { id: _id, ...rest } = event
  return rest
}

export function createSanitySyncRuntime(options: SanityCmsPluginOptions): SanitySyncRuntime {
  return {
    client: createSanityClient(options),
    logger: options.logger ?? console,
    mapEvent: options.mapEvent ?? defaultMapEvent,
    eventNames: {
      created: options.events?.created ?? "product.created",
      updated: options.events?.updated ?? "product.updated",
      deleted: options.events?.deleted ?? "product.deleted",
    },
  }
}
