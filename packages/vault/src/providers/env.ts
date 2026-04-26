import type { VaultProvider, VaultSecret } from "../types.js"

export interface EnvVaultProviderOptions {
  /** Bindings/env to read from (`process.env`, Worker `env`, etc.). */
  env: Record<string, unknown>
  /**
   * Map a `(vaultSlug, key)` tuple to the env var name to read. Defaults to
   * `key` (slug ignored) so callers can drop in a flat env without
   * thinking about vault organization. Pass a custom function to namespace
   * by slug, e.g. `(slug, key) => `${slug.toUpperCase()}_${key}``.
   */
  resolveEnvKey?: (vaultSlug: string, key: string) => string
}

/**
 * Vault provider that reads from a flat env-style record. Useful for
 * self-hosters who keep secrets in `.dev.vars` or `process.env` and don't
 * want a separate cloud-vault dependency.
 *
 * Returns `null` for any key whose env value isn't a non-empty string.
 */
export function createEnvVaultProvider(options: EnvVaultProviderOptions): VaultProvider {
  const resolve = options.resolveEnvKey ?? ((_slug: string, key: string) => key)
  return {
    name: "env",
    async getSecret(vaultSlug: string, key: string): Promise<VaultSecret | null> {
      const envKey = resolve(vaultSlug, key)
      const raw = options.env[envKey]
      if (typeof raw !== "string" || raw.length === 0) {
        return null
      }
      return { key, value: raw, version: 1 }
    },
  }
}
