import type { ModuleContainer } from "./container.js"
import type { EventBus } from "./events.js"
import type { LinkableDefinition } from "./links.js"

export interface BootstrapContext<TBindings = unknown> {
  /** Runtime bindings/environment available to the current app/isolate. */
  bindings: TBindings
  /** Shared app container used for explicit runtime registrations. */
  container: ModuleContainer
  /** Canonical event bus for the current app runtime. */
  eventBus: EventBus
}

export type BootstrapHandler<TBindings = unknown> = (
  ctx: BootstrapContext<TBindings>,
) => Promise<void> | void

/**
 * A Voyant module provides domain identity and lifecycle hooks.
 *
 * Transport adapters such as Hono or Next.js are layered on top of this
 * contract instead of being part of core.
 */
export interface Module {
  /** Unique module identifier (e.g., "contacts", "bookings") */
  name: string

  /** Hook handlers keyed by event name (e.g., "contacts.beforeCreate") */
  hooks?: Record<string, (...args: unknown[]) => Promise<void> | void>

  /**
   * Optional service instance registered in the container under {@link name}.
   * Other modules resolve it via `container.resolve<T>(name)`.
   */
  service?: unknown

  /**
   * Optional lazy runtime bootstrap executed once per app/isolate, on the
   * first request where bindings are available.
   *
   * Use this to validate runtime configuration, register app-owned provider
   * instances, or perform other lightweight startup wiring. Do not use it for
   * long-running syncs or scheduled background work.
   */
  bootstrap?: BootstrapHandler

  /**
   * Entities this module exposes for cross-module linking via `defineLink`.
   * Keyed by entity name (e.g. `{ person: ..., organization: ... }`).
   */
  linkable?: Record<string, LinkableDefinition>
}

/**
 * A Voyant extension adds hooks to an existing module without modifying
 * its source code.
 */
export interface Extension {
  /** Unique extension identifier */
  name: string

  /** Which module this extension attaches to (e.g., "suppliers") */
  module: string

  /** Hook handlers keyed by event name */
  hooks?: Record<string, (...args: unknown[]) => Promise<void> | void>

  /**
   * Optional lazy runtime bootstrap executed once per app/isolate, on the
   * first request where bindings are available.
   */
  bootstrap?: BootstrapHandler
}
