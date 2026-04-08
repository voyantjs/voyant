type HookHandler = (...args: unknown[]) => Promise<void> | void

/**
 * Simple typed event emitter for module lifecycle hooks.
 *
 * Events are namespaced by convention: "module.event"
 * (e.g., "contacts.beforeCreate", "bookings.afterConfirm")
 */
class HookSystem {
  private handlers = new Map<string, Set<HookHandler>>()

  /** Register a handler for an event */
  on(event: string, handler: HookHandler): void {
    let set = this.handlers.get(event)
    if (!set) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(handler)
  }

  /** Remove a handler for an event */
  off(event: string, handler: HookHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  /** Emit an event, calling all registered handlers sequentially */
  async emit(event: string, ...args: unknown[]): Promise<void> {
    const set = this.handlers.get(event)
    if (!set) return
    for (const handler of set) {
      await handler(...args)
    }
  }
}

export const hooks = new HookSystem()
