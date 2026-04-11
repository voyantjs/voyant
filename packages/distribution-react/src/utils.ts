import type { BookingOption, ProductOption, SupplierOption } from "./schemas.js"

export function nullableString(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed ? trimmed : null
}

export function nullableNumber(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed ? Number(trimmed) : null
}

export function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return ""
  return value.slice(0, 16)
}

export function toIsoDateTime(value: string | null | undefined) {
  if (!value) return null
  return new Date(value).toISOString()
}

export function formatDateTime(value: string | null) {
  return value ? value.replace("T", " ").slice(0, 16) : "-"
}

export function labelById(
  options: Array<SupplierOption | ProductOption | BookingOption>,
  id: string | null,
) {
  if (!id) return "-"
  const match = options.find((option) => option.id === id)
  if (!match) return id
  if ("name" in match) return match.name
  return match.bookingNumber
}

export function parseJsonRecord(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return null
  const parsed = JSON.parse(trimmed) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object")
  }
  return parsed as Record<string, unknown>
}

export function formatSelectionLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
