/**
 * A single secret resolved from the vault.
 */
export interface VaultSecret {
  /** Stable secret key inside the vault. */
  key: string
  /** Secret value. */
  value: string
  /** Monotonic version when the provider tracks them; otherwise `1`. */
  version?: number
  /** Last update timestamp when known (ISO 8601). */
  updatedAt?: string
}

/**
 * Pluggable secret provider.
 *
 * Built-in implementations:
 * - `createEnvVaultProvider` — reads from a flat `Record<string, unknown>`
 *   (e.g. `process.env`, Cloudflare Worker `env`)
 * - `createVoyantCloudVaultProvider` — Voyant Cloud `/vault/v1/*`
 */
export interface VaultProvider {
  /** Unique provider name (e.g. `"voyant-cloud-vault"`, `"env"`). */
  readonly name: string
  /**
   * Resolve a single secret. Returns `null` when the key is unset.
   *
   * `vaultSlug` selects which vault to read from. Providers that do not
   * support multiple vaults (env, …) ignore it.
   */
  getSecret(vaultSlug: string, key: string): Promise<VaultSecret | null>
}
