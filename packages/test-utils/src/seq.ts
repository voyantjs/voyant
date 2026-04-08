/**
 * Sequence counters for generating unique test fixture values without relying
 * on randomness (makes failures reproducible).
 */

/**
 * Builds a stateful counter function. Each call returns the next integer.
 *
 * @example
 * const next = createCounter()
 * next() // 1
 * next() // 2
 * next.reset()
 * next() // 1
 */
export interface Counter {
  (): number
  reset: () => void
  peek: () => number
}

export function createCounter(start = 0): Counter {
  let value = start
  const fn = (() => {
    value++
    return value
  }) as Counter
  fn.reset = () => {
    value = start
  }
  fn.peek = () => value
  return fn
}

/**
 * Builds a stateful string generator that formats the counter with a prefix
 * and zero-padding.
 *
 * @example
 * const nextBooking = createSequence("BK-TEST", 6)
 * nextBooking() // "BK-TEST-000001"
 * nextBooking() // "BK-TEST-000002"
 */
export interface Sequence {
  (): string
  reset: () => void
  peek: () => number
}

export function createSequence(prefix: string, padLength = 4, start = 0): Sequence {
  let value = start
  const fn = (() => {
    value++
    return `${prefix}-${String(value).padStart(padLength, "0")}`
  }) as Sequence
  fn.reset = () => {
    value = start
  }
  fn.peek = () => value
  return fn
}

/**
 * Builds a simple name factory: `John 1`, `John 2`, etc.
 */
export function createNameFactory(base: string): () => string {
  let i = 0
  return () => {
    i++
    return `${base} ${i}`
  }
}
