// Deterministic clock and RNG used by the workflow body.
//
// `ctx.now()` must return the timestamp of the event currently being
// consumed from the journal during replay (§4.5 of docs/design.md).
// `ctx.random()` / `ctx.randomUUID()` are seeded from the run id so
// replays produce the same values.

export interface ClockState {
  /** Base wall-clock time recorded at run start. */
  readonly baseWallClock: number
  /** Offset from baseWallClock at which ctx.now() should return — set by the executor when replaying journaled events. */
  offset: number
}

export function createClock(runStartedAt: number): ClockState {
  return { baseWallClock: runStartedAt, offset: 0 }
}

export function now(clock: ClockState): number {
  return clock.baseWallClock + clock.offset
}

/** Advance the clock to the event currently being replayed. */
export function advanceClockTo(clock: ClockState, eventAt: number): void {
  clock.offset = eventAt - clock.baseWallClock
}

/**
 * Mulberry32 PRNG — fast, fine for workflow-determinism use. Seeded
 * from a 32-bit hash of the run id. Not cryptographic.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(runId: string): number {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5
  for (let i = 0; i < runId.length; i++) {
    hash ^= runId.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function createRandom(runId: string): () => number {
  return seededRandom(hashSeed(runId))
}

const HEX = "0123456789abcdef"

export function createRandomUUID(rng: () => number): () => string {
  // v4-shaped deterministic UUID. Not cryptographically random; matches
  // the style of crypto.randomUUID but is reproducible across replays.
  return () => {
    const bytes = new Uint8Array(16)
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(rng() * 256)
    bytes[6] = (bytes[6]! & 0x0f) | 0x40 // version 4 (high nibble of byte 6)
    bytes[8] = (bytes[8]! & 0x3f) | 0x80 // variant RFC 4122 (high bits of byte 8)
    let s = ""
    for (let i = 0; i < 16; i++) {
      const b = bytes[i]!
      s += HEX[b >>> 4]! + HEX[b & 0x0f]!
    }
    // s is 32 hex chars; slice into 8-4-4-4-12 groups.
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`
  }
}
