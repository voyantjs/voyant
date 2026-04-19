// Pure scale helpers. Given a range `[startedAt, endAt]`, convert an
// absolute timestamp or a `[at, endAt]` pair to percentage offsets /
// widths of the timeline width. A minimum width keeps tiny spans
// (sub-millisecond steps) visible.

export interface Scale {
  startedAt: number
  endAt: number
  durationMs: number
  toPercent: (absMs: number) => number
  spanPercent: (at: number, endAt?: number) => { left: number; width: number }
  ticks: readonly { at: number; labelMs: number }[]
}

const MIN_WIDTH_PCT = 0.5

export function createScale(startedAt: number, endAt: number): Scale {
  const durationMs = Math.max(1, endAt - startedAt)

  const toPercent = (absMs: number): number => {
    const delta = Math.max(0, Math.min(durationMs, absMs - startedAt))
    return (delta / durationMs) * 100
  }

  const spanPercent = (at: number, spanEndAt?: number): { left: number; width: number } => {
    const left = toPercent(at)
    const rightAbs = spanEndAt ?? endAt
    const right = toPercent(rightAbs)
    const width = Math.max(MIN_WIDTH_PCT, right - left)
    return { left, width }
  }

  // 5 evenly-spaced ticks including both ends (0%, 25%, 50%, 75%, 100%).
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    at: startedAt + durationMs * f,
    labelMs: Math.round(durationMs * f),
  }))

  return { startedAt, endAt, durationMs, toPercent, spanPercent, ticks }
}

export function formatTickMs(ms: number): string {
  if (ms === 0) return "0"
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m${Math.floor((ms % 60_000) / 1000)}s`
  return `${Math.floor(ms / 3_600_000)}h`
}
