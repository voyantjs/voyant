/**
 * Event handler callback invoked when a subscribed event is emitted.
 */
export type EventHandler<TData = unknown> = (data: TData) => Promise<void> | void

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
 * - Hatchet — emit enqueues a durable task
 * - Cloudflare Queues — edge-native
 *
 * Event naming convention: `<resource>.<pastTenseAction>` in dot-case.
 * Examples: `booking.created`, `quote.accepted`, `payment.received`.
 */
export interface EventBus {
  /** Emit an event. Fire-and-forget; subscribers cannot affect the emitter. */
  emit(event: string, data: unknown): Promise<void>

  /** Subscribe to an event by name. Returns an unsubscribe handle. */
  subscribe(event: string, handler: EventHandler): Subscription
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
    async emit(event, data) {
      const set = handlers.get(event)
      if (!set) return
      for (const handler of set) {
        try {
          await handler(data)
        } catch (err) {
          // Subscribers are fire-and-forget — log and continue.
          console.error(`[events] subscriber error for "${event}":`, err)
        }
      }
    },
    subscribe(event, handler) {
      let set = handlers.get(event)
      if (!set) {
        set = new Set()
        handlers.set(event, set)
      }
      set.add(handler)
      return {
        unsubscribe() {
          set?.delete(handler)
        },
      }
    },
  }
}
