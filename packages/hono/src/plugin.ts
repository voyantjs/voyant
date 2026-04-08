import type { LinkDefinition, Subscriber } from "@voyantjs/core"

import type { HonoExtension, HonoModule } from "./module.js"

/**
 * Hono-flavoured plugin bundle.
 *
 * Unlike the transport-agnostic `Plugin` in `@voyantjs/core`, a
 * `HonoPlugin` contributes {@link HonoModule} / {@link HonoExtension}
 * wrappers that can carry HTTP routes.
 *
 * Registered via `createApp({ plugins: [...] })` — the app factory expands
 * each plugin into the underlying modules, extensions, subscribers, and link
 * definitions before mounting them.
 */
export interface HonoPlugin {
  /** Unique plugin identifier (e.g. "payload-cms", "bokun"). */
  name: string
  /** Optional version tag for diagnostics. */
  version?: string
  /** Hono modules (module + routes) contributed by the plugin. */
  modules?: HonoModule[]
  /** Hono extensions (extension + routes) contributed by the plugin. */
  extensions?: HonoExtension[]
  /** Event subscribers wired to the caller's event bus, when provided. */
  subscribers?: Subscriber[]
  /** Link definitions contributed by the plugin. */
  links?: LinkDefinition[]
}

/**
 * Identity helper — returns the plugin unchanged, purely for IDE inference.
 */
export function defineHonoPlugin<P extends HonoPlugin>(plugin: P): P {
  return plugin
}

export interface ExpandedHonoPlugins {
  modules: HonoModule[]
  extensions: HonoExtension[]
  subscribers: Subscriber[]
  links: LinkDefinition[]
}

/**
 * Flatten a list of {@link HonoPlugin} values into their constituent pieces.
 *
 * Throws if two plugins declare the same `name`.
 */
export function expandHonoPlugins(plugins: ReadonlyArray<HonoPlugin>): ExpandedHonoPlugins {
  const seen = new Set<string>()
  const modules: HonoModule[] = []
  const extensions: HonoExtension[] = []
  const subscribers: Subscriber[] = []
  const links: LinkDefinition[] = []

  for (const plugin of plugins) {
    if (seen.has(plugin.name)) {
      throw new Error(`Duplicate plugin name: "${plugin.name}"`)
    }
    seen.add(plugin.name)

    if (plugin.modules) modules.push(...plugin.modules)
    if (plugin.extensions) extensions.push(...plugin.extensions)
    if (plugin.subscribers) subscribers.push(...plugin.subscribers)
    if (plugin.links) links.push(...plugin.links)
  }

  return { modules, extensions, subscribers, links }
}
