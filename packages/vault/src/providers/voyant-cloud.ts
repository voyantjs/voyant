import type { VoyantCloudClient } from "@voyantjs/voyant-cloud"

import type { VaultProvider, VaultSecret } from "../types.js"

export interface VoyantCloudVaultProviderOptions {
  /** Cloud SDK client. Construct via `getVoyantCloudClient(env)`. */
  client: VoyantCloudClient
}

/**
 * Vault provider backed by the Voyant Cloud `/vault/v1/*` endpoints. Each
 * call resolves a secret by `(vaultSlug, key)` directly through the SDK and
 * returns `null` for any error from the cloud (404, network hiccup, …) so
 * callers can fall back gracefully instead of crashing at boot.
 */
export function createVoyantCloudVaultProvider(
  options: VoyantCloudVaultProviderOptions,
): VaultProvider {
  return {
    name: "voyant-cloud-vault",
    async getSecret(vaultSlug: string, key: string): Promise<VaultSecret | null> {
      try {
        const secret = await options.client.vault.getSecret(vaultSlug, key)
        return {
          key: secret.key,
          value: secret.value,
          version: secret.version,
          updatedAt: secret.updatedAt,
        }
      } catch {
        return null
      }
    },
  }
}
