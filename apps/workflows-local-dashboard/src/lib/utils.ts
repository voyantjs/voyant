export function formatRelative(deltaMs: number): string {
  if (deltaMs <= 0) return "due"
  if (deltaMs < 60_000) return `in ${Math.ceil(deltaMs / 1000)}s`
  if (deltaMs < 3_600_000) return `in ${Math.ceil(deltaMs / 60_000)}m`
  if (deltaMs < 86_400_000) return `in ${Math.ceil(deltaMs / 3_600_000)}h`
  return `in ${Math.ceil(deltaMs / 86_400_000)}d`
}

export function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return "—"
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`
  return `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
