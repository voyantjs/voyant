import type { z } from "zod"

export type KvCodec<T> = {
  namespace: string
  schema: z.ZodType<T>
  encode: (value: T) => string
  decode: (raw: string) => T
}

type ValidationError = Error & {
  issues?: z.ZodIssue[]
}

export function createKvCodec<T>(namespace: string, schema: z.ZodType<T>): KvCodec<T> {
  return {
    namespace,
    schema,
    encode: (value: T) => JSON.stringify(schema.parse(value)),
    decode: (raw: string) => schema.parse(JSON.parse(raw)),
  }
}

export function assertValid<T>(schema: z.ZodType<T>, value: unknown, message?: string): T {
  const res = schema.safeParse(value)
  if (!res.success) {
    const err = new Error(message || "Validation failed") as ValidationError
    err.issues = res.error.issues
    throw err
  }
  return res.data
}
