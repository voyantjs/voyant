// Minimal temporal helpers used by client apps
export function toIsoDateUtc(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  return d.toISOString().slice(0, 10)
}
