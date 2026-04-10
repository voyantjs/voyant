import { queryOptions } from "@tanstack/react-query"
import { type Activity, Clock, Pencil, Plus, RefreshCw, UserPlus } from "lucide-react"
import { api } from "@/lib/api-client"

export type BookingDetail = {
  id: string
  bookingNumber: string
  status: "draft" | "confirmed" | "in_progress" | "completed" | "cancelled"
  personId: string | null
  organizationId: string | null
  sellCurrency: string
  sellAmountCents: number | null
  costAmountCents: number | null
  marginPercent: number | null
  startDate: string | null
  endDate: string | null
  pax: number | null
  internalNotes: string | null
  createdAt: string
  updatedAt: string
}

export type Passenger = {
  id: string
  bookingId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  specialRequests: string | null
  createdAt: string
}

export type SupplierStatus = {
  id: string
  bookingId: string
  supplierServiceId: string | null
  serviceName: string
  status: "pending" | "confirmed" | "rejected" | "cancelled"
  supplierReference: string | null
  costCurrency: string
  costAmountCents: number
  notes: string | null
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ActivityEntry = {
  id: string
  bookingId: string
  actorId: string | null
  activityType: string
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type BookingNote = {
  id: string
  bookingId: string
  authorId: string
  content: string
  createdAt: string
}

export function getBookingQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["booking", id],
    queryFn: () => api.get<{ data: BookingDetail }>(`/v1/bookings/${id}`),
  })
}
export function getBookingPassengersQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["booking-passengers", id],
    queryFn: () => api.get<{ data: Passenger[] }>(`/v1/bookings/${id}/passengers`),
  })
}
export function getBookingSupplierStatusesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["booking-supplier-statuses", id],
    queryFn: () => api.get<{ data: SupplierStatus[] }>(`/v1/bookings/${id}/supplier-statuses`),
  })
}
export function getBookingActivityQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["booking-activity", id],
    queryFn: () => api.get<{ data: ActivityEntry[] }>(`/v1/bookings/${id}/activity`),
  })
}
export function getBookingNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["booking-notes", id],
    queryFn: () => api.get<{ data: BookingNote[] }>(`/v1/bookings/${id}/notes`),
  })
}

export const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  confirmed: "default",
  in_progress: "secondary",
  completed: "default",
  cancelled: "destructive",
}
export const supplierStatusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  confirmed: "default",
  rejected: "destructive",
  cancelled: "secondary",
}

export function formatAmount(cents: number | null, currency: string): string {
  if (cents == null) return "-"
  return `${(cents / 100).toFixed(2)} ${currency}`
}
export function formatMargin(percent: number | null): string {
  if (percent == null) return "-"
  return `${(percent / 100).toFixed(2)}%`
}
export function formatStatus(status: string): string {
  return status.replace("_", " ")
}

export const activityIcons: Record<string, typeof Activity> = {
  booking_created: Plus,
  booking_converted: RefreshCw,
  status_change: Clock,
  supplier_update: RefreshCw,
  passenger_update: UserPlus,
  note_added: Pencil,
}
