import type { z } from "zod"

// Validate plaintext JSON shape using provided Zod schema when encoding/decoding
export function createKmsCodec<T>(schema: z.ZodType<T>) {
  return {
    encode(value: T): string {
      return JSON.stringify(schema.parse(value))
    },
    decode(plaintext: string): T {
      const json: unknown = JSON.parse(plaintext)
      return schema.parse(json)
    },
  }
}
