import { generateSymmetricKmsKey, SymmetricAesGcmKmsProvider } from "./kms-symmetric.js"

export interface EnvKmsConfig {
  /** Base64-encoded 32-byte master key. */
  key: string
}

export function generateEnvKmsKey(): string {
  return generateSymmetricKmsKey()
}

export class EnvKmsProvider extends SymmetricAesGcmKmsProvider {
  readonly name = "env" as const
  protected readonly prefix = "env:v1:"
  protected readonly label = "EnvKmsProvider"

  constructor(config: EnvKmsConfig) {
    super(config.key)
  }
}
