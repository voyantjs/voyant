import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { DepartureSlot } from "./product-departure-dialog"
import type { AvailabilityRule } from "./product-schedule-dialog"

export type ProductDay = {
  id: string
  productId: string
  dayNumber: number
  title: string | null
  description: string | null
  location: string | null
  createdAt: string
  updatedAt: string
}

export type DayService = {
  id: string
  dayId: string
  supplierServiceId: string | null
  serviceType: "accommodation" | "transfer" | "experience" | "guide" | "meal" | "other"
  name: string
  description: string | null
  costCurrency: string
  costAmountCents: number
  quantity: number
  sortOrder: number | null
  notes: string | null
  createdAt: string
}

export type ProductVersion = {
  id: string
  productId: string
  versionNumber: number
  authorId: string
  notes: string | null
  createdAt: string
}

export type ProductNote = {
  id: string
  productId: string
  authorId: string
  content: string
  createdAt: string
}

export function getProductDaysQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-days", id],
    queryFn: () => api.get<{ data: ProductDay[] }>(`/v1/products/${id}/days`),
  })
}

export function getProductVersionsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-versions", id],
    queryFn: () => api.get<{ data: ProductVersion[] }>(`/v1/products/${id}/versions`),
  })
}

export function getProductDayServicesQueryOptions(productId: string, dayId: string) {
  return queryOptions({
    queryKey: ["product-day-services", productId, dayId],
    queryFn: () =>
      api.get<{ data: DayService[] }>(`/v1/products/${productId}/days/${dayId}/services`),
  })
}

export function getProductNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-notes", id],
    queryFn: () => api.get<{ data: ProductNote[] }>(`/v1/products/${id}/notes`),
  })
}

export function getProductSlotsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-slots", id],
    queryFn: () =>
      api.get<{ data: DepartureSlot[] }>(`/v1/availability/slots?productId=${id}&limit=25`),
  })
}

export function getProductRulesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-rules", id],
    queryFn: () =>
      api.get<{ data: AvailabilityRule[] }>(`/v1/availability/rules?productId=${id}&limit=50`),
  })
}

export const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  active: "default",
  archived: "secondary",
}

export function formatAmount(cents: number | null, currency: string): string {
  if (cents == null) return "-"
  return `${(cents / 100).toFixed(2)} ${currency}`
}

export function formatMargin(percent: number | null): string {
  if (percent == null) return "-"
  return `${(percent / 100).toFixed(2)}%`
}

export function formatSlotTime(iso: string): string {
  const date = new Date(iso)
  const hh = String(date.getUTCHours()).padStart(2, "0")
  const mm = String(date.getUTCMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

export function formatSlotDate(iso: string): string {
  const date = new Date(iso)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatDuration(slot: DepartureSlot): string {
  if (slot.nights != null || slot.days != null) {
    const parts: string[] = []
    if (slot.days != null) parts.push(`${slot.days} day${slot.days === 1 ? "" : "s"}`)
    if (slot.nights != null) parts.push(`${slot.nights} night${slot.nights === 1 ? "" : "s"}`)
    return parts.join(" / ")
  }
  if (!slot.endsAt) return "-"
  const startMs = new Date(slot.startsAt).getTime()
  const endMs = new Date(slot.endsAt).getTime()
  const diffMs = endMs - startMs
  if (diffMs <= 0) return "-"
  const hours = diffMs / 3_600_000
  if (hours < 24) return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`
  const startDate = formatSlotDate(slot.startsAt)
  const endDate = formatSlotDate(slot.endsAt)
  const nights = Math.round(
    (new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) /
      86_400_000,
  )
  return `${nights} night${nights === 1 ? "" : "s"}`
}

export function formatCapacity(slot: DepartureSlot): string {
  if (slot.unlimited) return "Unlimited"
  if (slot.initialPax == null) return "-"
  const remaining = slot.remainingPax ?? slot.initialPax
  return `${remaining} / ${slot.initialPax}`
}

export const slotStatusVariant: Record<
  DepartureSlot["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  open: "default",
  closed: "secondary",
  sold_out: "outline",
  cancelled: "destructive",
}
