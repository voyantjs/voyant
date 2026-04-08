import { generateSymmetricKmsKey, SymmetricAesGcmKmsProvider } from "./kms-symmetric.js"

export interface LocalKmsConfig {
  /** Base64-encoded 32-byte master key. */
  key: string
}

export function generateLocalKmsKey(): string {
  return generateSymmetricKmsKey()
}

export class LocalKmsProvider extends SymmetricAesGcmKmsProvider {
  readonly name = "local" as const
  protected readonly prefix = "local:v1:"
  protected readonly label = "LocalKmsProvider"

  constructor(config: LocalKmsConfig) {
    super(config.key)
  }
}
