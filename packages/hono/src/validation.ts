import type { Context } from "hono"
import { ZodError, type ZodType } from "zod"

export class RequestValidationError extends Error {
  readonly status = 400
  readonly code = "invalid_request"
  readonly details?: Record<string, unknown>

  constructor(message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = "RequestValidationError"
    this.details = details
  }
}

function toValidationError(
  error: ZodError,
  fallbackMessage = "Invalid request",
): RequestValidationError {
  return new RequestValidationError(error.issues[0]?.message ?? fallbackMessage, {
    issues: error.issues,
    fields: error.flatten(),
  })
}

function validate<T>(schema: ZodType<T>, input: unknown, fallbackMessage?: string): T {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw toValidationError(parsed.error, fallbackMessage)
  }

  return parsed.data
}

export async function parseJsonBody<T>(
  c: Context,
  schema: ZodType<T>,
  options?: { invalidJsonMessage?: string; invalidBodyMessage?: string },
): Promise<T> {
  let input: unknown

  try {
    input = await c.req.json()
  } catch {
    throw new RequestValidationError(options?.invalidJsonMessage ?? "Invalid JSON body")
  }

  return validate(schema, input, options?.invalidBodyMessage)
}

export function parseQuery<T>(
  c: Context,
  schema: ZodType<T>,
  options?: { invalidQueryMessage?: string },
): T {
  return validate(
    schema,
    Object.fromEntries(new URL(c.req.url).searchParams),
    options?.invalidQueryMessage ?? "Invalid query parameters",
  )
}

export function normalizeValidationError(error: unknown): RequestValidationError | undefined {
  if (error instanceof RequestValidationError) {
    return error
  }

  if (error instanceof ZodError) {
    return toValidationError(error)
  }

  return undefined
}
