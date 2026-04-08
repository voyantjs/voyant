/**
 * A lightweight module container providing per-request service resolution.
 *
 * Modules register services at app boot; routes resolve them per request.
 * The container is intentionally minimal (Map-based) — for richer DI
 * (scoping, factory lifetimes) a template can wrap or replace it.
 */
export interface ModuleContainer {
  /** Register a service by name. Overwrites any existing registration. */
  register(name: string, service: unknown): void

  /** Resolve a service by name. Throws if not registered. */
  resolve<T>(name: string): T

  /** Check if a service is registered. */
  has(name: string): boolean
}

/**
 * Create a new module container backed by an in-memory Map.
 */
export function createContainer(): ModuleContainer {
  const services = new Map<string, unknown>()

  return {
    register(name, service) {
      services.set(name, service)
    },
    resolve<T>(name: string): T {
      if (!services.has(name)) {
        throw new Error(`Service "${name}" is not registered in the container`)
      }
      return services.get(name) as T
    },
    has(name) {
      return services.has(name)
    },
  }
}
