/**
 * High-level classification for public event consumers.
 *
 * - `domain` events represent business milestones that other modules or
 *   external integrations may reasonably care about.
 * - `internal` events are service/process signals that remain useful for
 *   subscribers, diagnostics, and automation, but are not part of the core
 *   business language.
 */
export type EventCategory = "domain" | "internal"

/**
 * Where an event was emitted from. This helps consumers understand whether
 * an event originated from a workflow boundary, a lower-level service, or a
 * transport/runtime edge.
 */
export type EventSource = "workflow" | "service" | "route" | "subscriber" | "system"

/**
 * Optional metadata attached to an emitted event.
 *
 * Templates and adapters may extend this with runtime-specific fields such as
 * correlation identifiers or delivery handles.
 */
export interface EventMetadata {
  category?: EventCategory
  source?: EventSource
  correlationId?: string
  causationId?: string
  [key: string]: unknown
}

/**
 * Standard event envelope delivered to subscribers.
 */
export interface EventEnvelope<
  TData = unknown,
  TMetadata extends EventMetadata | undefined = EventMetadata | undefined,
> {
  /** Event name, following the `<resource>.<pastTenseAction>` convention. */
  name: string
  /** Business payload emitted by the caller. */
  data: TData
  /** Optional metadata for source/taxonomy/tracing. */
  metadata?: TMetadata
  /** ISO timestamp indicating when the event was emitted. */
  emittedAt: string
}

/**
 * Event handler callback invoked when a subscribed event is emitted.
 */
export type EventHandler<
  TData = unknown,
  TMetadata extends EventMetadata | undefined = EventMetadata | undefined,
> = (event: EventEnvelope<TData, TMetadata>) => Promise<void> | void

/**
 * Subscription handle returned from {@link EventBus.subscribe}.
 *
 * Call `unsubscribe()` to remove the handler.
 */
export interface Subscription {
  unsubscribe(): void
}

/**
 * Abstract event bus interface. Implementations live in templates or plugins.
 *
 * Adapter examples:
 * - In-process (default, ships with core)
 * - Cloudflare Queues — edge-native
 * - Postgres-backed durable queue — for refund-saga-grade durability
 *
 * Event naming convention: `<resource>.<pastTenseAction>` in dot-case.
 * Examples: `booking.created`, `quote.accepted`, `payment.received`.
 */
export interface EventBus {
  /** Emit an event. Fire-and-forget; subscribers cannot affect the emitter. */
  emit<TData, TMetadata extends EventMetadata | undefined = EventMetadata | undefined>(
    event: string,
    data: TData,
    metadata?: TMetadata,
  ): Promise<void>

  /** Subscribe to an event by name. Returns an unsubscribe handle. */
  subscribe<TData, TMetadata extends EventMetadata | undefined = EventMetadata | undefined>(
    event: string,
    handler: EventHandler<TData, TMetadata>,
  ): Subscription
}

/**
 * Create an in-process event bus.
 *
 * Handlers run sequentially in the order they were subscribed. Errors
 * thrown by a handler are caught and logged but do not block subsequent
 * handlers from running, matching the "subscribers are fire-and-forget"
 * contract.
 */
export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<EventHandler>>()

  return {
    async emit<TData, TMetadata extends EventMetadata | undefined = EventMetadata | undefined>(
      event: string,
      data: TData,
      metadata?: TMetadata,
    ) {
      const set = handlers.get(event)
      if (!set) return
      const envelope: EventEnvelope<TData, TMetadata> = {
        name: event,
        data,
        emittedAt: new Date().toISOString(),
        ...(metadata === undefined ? {} : { metadata }),
      }
      for (const handler of set) {
        try {
          await handler(envelope)
        } catch (err) {
          // Subscribers are fire-and-forget — log and continue.
          console.error(`[events] subscriber error for "${event}":`, err)
        }
      }
    },
    subscribe<TData, TMetadata extends EventMetadata | undefined = EventMetadata | undefined>(
      event: string,
      handler: EventHandler<TData, TMetadata>,
    ) {
      let set = handlers.get(event)
      if (!set) {
        set = new Set()
        handlers.set(event, set)
      }
      set.add(handler as EventHandler)
      return {
        unsubscribe() {
          set?.delete(handler as EventHandler)
        },
      }
    },
  }
}
