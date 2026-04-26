import type { VaultProvider, VaultSecret } from "./types.js"

export class VaultError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "VaultError"
  }
}

/**
 * Thin wrapper around a single {@link VaultProvider}. Most templates use
 * exactly one vault backend at a time. Adds:
 *
 * - `requireSecret(slug, key)` — throws {@link VaultError} when the key is
 *   absent, removing the boilerplate `if (!secret) throw …` everywhere.
 * - in-memory caching keyed by `slug:key` (per service instance) so a boot
 *   path that hydrates many keys doesn't pay round-trips for re-reads.
 */
export interface VaultService extends VaultProvider {
  readonly provider: VaultProvider
  requireSecret(vaultSlug: string, key: string): Promise<VaultSecret>
}

export interface CreateVaultServiceOptions {
  /** Disable in-memory caching. Defaults to `false`. */
  noCache?: boolean
}

export function createVaultService(
  provider: VaultProvider,
  options: CreateVaultServiceOptions = {},
): VaultService {
  const cache = options.noCache ? null : new Map<string, VaultSecret | null>()

  const getSecret = async (vaultSlug: string, key: string) => {
    const cacheKey = `${vaultSlug}\x00${key}`
    if (cache?.has(cacheKey)) {
      return cache.get(cacheKey) ?? null
    }
    const value = await provider.getSecret(vaultSlug, key)
    cache?.set(cacheKey, value)
    return value
  }

  return {
    provider,
    name: provider.name,
    getSecret,
    async requireSecret(vaultSlug: string, key: string): Promise<VaultSecret> {
      const secret = await getSecret(vaultSlug, key)
      if (!secret) {
        throw new VaultError(`Vault secret "${key}" not found in vault "${vaultSlug}"`)
      }
      return secret
    },
  }
}
