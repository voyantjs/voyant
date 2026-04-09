import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { describeRRule } from "@voyantjs/availability/rrule"
import {
  defaultFetcher,
  getProductQueryOptions,
  productsQueryKeys,
  useProduct,
} from "@voyantjs/products-react"
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  FileText,
  History,
  Loader2,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@/components/ui"

import { api } from "@/lib/api-client"
import { getApiUrl } from "@/lib/env"

import { DayDialog } from "./_components/day-dialog"
import { DepartureDialog, type DepartureSlot } from "./_components/departure-dialog"
import { OptionsSection } from "./_components/options-section"
import { ProductDialog } from "./_components/product-dialog"
import { type AvailabilityRule, ScheduleDialog } from "./_components/schedule-dialog"
import { ServiceDialog } from "./_components/service-dialog"
import { VersionDialog } from "./_components/version-dialog"

type ProductDay = {
  id: string
  productId: string
  dayNumber: number
  title: string | null
  description: string | null
  location: string | null
  createdAt: string
  updatedAt: string
}

type DayService = {
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

type ProductVersion = {
  id: string
  productId: string
  versionNumber: number
  authorId: string
  notes: string | null
  createdAt: string
}

type ProductNote = {
  id: string
  productId: string
  authorId: string
  content: string
  createdAt: string
}

function getProductDaysQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-days", id],
    queryFn: () => api.get<{ data: ProductDay[] }>(`/v1/products/${id}/days`),
  })
}

function getProductVersionsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-versions", id],
    queryFn: () => api.get<{ data: ProductVersion[] }>(`/v1/products/${id}/versions`),
  })
}

function getProductNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-notes", id],
    queryFn: () => api.get<{ data: ProductNote[] }>(`/v1/products/${id}/notes`),
  })
}

function getProductSlotsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-slots", id],
    queryFn: () =>
      api.get<{ data: DepartureSlot[] }>(`/v1/availability/slots?productId=${id}&limit=200`),
  })
}

function getProductRulesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["product-rules", id],
    queryFn: () =>
      api.get<{ data: AvailabilityRule[] }>(`/v1/availability/rules?productId=${id}&limit=50`),
  })
}

export const Route = createFileRoute("/_workspace/products/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      getProductQueryOptions({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, params.id),
    )

    await Promise.all([
      context.queryClient.ensureQueryData(getProductDaysQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getProductVersionsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getProductNotesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getProductSlotsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getProductRulesQueryOptions(params.id)),
    ])
  },
  component: ProductDetailPage,
})

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  active: "default",
  archived: "secondary",
}

function formatAmount(cents: number | null, currency: string): string {
  if (cents == null) return "-"
  return `${(cents / 100).toFixed(2)} ${currency}`
}

function formatMargin(percent: number | null): string {
  if (percent == null) return "-"
  return `${(percent / 100).toFixed(2)}%`
}

function formatSlotTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getUTCHours()).padStart(2, "0")
  const mm = String(d.getUTCMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

function formatSlotDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDuration(slot: DepartureSlot): string {
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

function formatCapacity(slot: DepartureSlot): string {
  if (slot.unlimited) return "Unlimited"
  if (slot.initialPax == null) return "-"
  const remaining = slot.remainingPax ?? slot.initialPax
  return `${remaining} / ${slot.initialPax}`
}

const slotStatusVariant: Record<
  DepartureSlot["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  open: "default",
  closed: "secondary",
  sold_out: "outline",
  cancelled: "destructive",
}

function ProductDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [dayDialogOpen, setDayDialogOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<ProductDay | undefined>()
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [serviceDialogDayId, setServiceDialogDayId] = useState<string>("")
  const [editingService, setEditingService] = useState<DayService | undefined>()
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [departureDialogOpen, setDepartureDialogOpen] = useState(false)
  const [editingDeparture, setEditingDeparture] = useState<DepartureSlot | undefined>()
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AvailabilityRule | undefined>()

  const { data: product, isPending } = useProduct(id)

  const { data: daysData, refetch: refetchDays } = useQuery(getProductDaysQueryOptions(id))

  const { data: versionsData, refetch: refetchVersions } = useQuery(
    getProductVersionsQueryOptions(id),
  )

  const { data: notesData, refetch: refetchNotes } = useQuery(getProductNotesQueryOptions(id))

  const { data: slotsData, refetch: refetchSlots } = useQuery(getProductSlotsQueryOptions(id))

  const { data: rulesData, refetch: refetchRules } = useQuery(getProductRulesQueryOptions(id))

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/products/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      void navigate({ to: "/products" })
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.post(`/v1/products/${id}/notes`, { content }),
    onSuccess: () => {
      setNoteContent("")
      void refetchNotes()
    },
  })

  const deleteDayMutation = useMutation({
    mutationFn: (dayId: string) => api.delete(`/v1/products/${id}/days/${dayId}`),
    onSuccess: () => {
      void refetchDays()
    },
  })

  const deleteServiceMutation = useMutation({
    mutationFn: ({ dayId, serviceId }: { dayId: string; serviceId: string }) =>
      api.delete(`/v1/products/${id}/days/${dayId}/services/${serviceId}`),
  })

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => api.delete(`/v1/availability/slots/${slotId}`),
    onSuccess: () => {
      void refetchSlots()
    },
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => api.delete(`/v1/availability/rules/${ruleId}`),
    onSuccess: () => {
      void refetchRules()
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/products" })}>
          Back to Products
        </Button>
      </div>
    )
  }

  const nextDayNumber = (daysData?.data.length ?? 0) + 1

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/products" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant[product.status] ?? "secondary"} className="capitalize">
              {product.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setVersionDialogOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Create Version
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this product?")) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {product.description && (
              <div>
                <span className="text-muted-foreground">Description:</span>{" "}
                <span>{product.description}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Sell Currency:</span>{" "}
              <span>{product.sellCurrency}</span>
            </div>
            {product.sellAmountCents != null && (
              <div>
                <span className="text-muted-foreground">Sell Amount:</span>{" "}
                <span className="font-mono">
                  {formatAmount(product.sellAmountCents, product.sellCurrency)}
                </span>
              </div>
            )}
            {product.costAmountCents != null && (
              <div>
                <span className="text-muted-foreground">Cost Amount:</span>{" "}
                <span className="font-mono">
                  {formatAmount(product.costAmountCents, product.sellCurrency)}
                </span>
              </div>
            )}
            {product.marginPercent != null && (
              <div>
                <span className="text-muted-foreground">Margin:</span>{" "}
                <span className="font-mono">{formatMargin(product.marginPercent)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              <span>{new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>{" "}
              <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
            </div>
            <p className="border-t pt-3 mt-2 text-xs text-muted-foreground">
              Products are templates. Individual departures (dates and capacity) are managed in the
              Departures section below.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Departures */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Departures
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingDeparture(undefined)
              setDepartureDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Departure
          </Button>
        </CardHeader>
        <CardContent>
          {(!slotsData?.data || slotsData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No departures yet. Add a one-off departure or create a recurring schedule below.
            </p>
          )}

          {slotsData?.data && slotsData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Start</th>
                    <th className="text-left p-2 font-medium">End</th>
                    <th className="text-left p-2 font-medium">Duration</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Capacity</th>
                    <th className="text-left p-2 font-medium">Timezone</th>
                    <th className="p-2 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {slotsData.data.map((slot) => (
                    <tr key={slot.id} className="border-b last:border-b-0">
                      <td className="p-2">
                        <div className="font-mono text-xs">{slot.dateLocal}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatSlotTime(slot.startsAt)}
                        </div>
                      </td>
                      <td className="p-2">
                        {slot.endsAt ? (
                          <>
                            <div className="font-mono text-xs">{formatSlotDate(slot.endsAt)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatSlotTime(slot.endsAt)}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2 text-xs">{formatDuration(slot)}</td>
                      <td className="p-2">
                        <Badge
                          variant={slotStatusVariant[slot.status]}
                          className="capitalize text-xs"
                        >
                          {slot.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-2 font-mono text-xs">{formatCapacity(slot)}</td>
                      <td className="p-2 text-xs text-muted-foreground">{slot.timezone}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDeparture(slot)
                              setDepartureDialogOpen(true)
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Delete this departure?")) {
                                deleteSlotMutation.mutate(slot.id)
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Schedules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Recurring Schedules
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingSchedule(undefined)
              setScheduleDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        </CardHeader>
        <CardContent>
          {(!rulesData?.data || rulesData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No recurring schedules. Define a rule (e.g. every Monday) to auto-generate departures.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {rulesData?.data.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{describeRRule(rule.recurrenceRule)}</span>
                    {!rule.active && (
                      <Badge variant="outline" className="text-xs">
                        inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max {rule.maxCapacity} pax · {rule.timezone}
                    {rule.cutoffMinutes != null && ` · cutoff ${rule.cutoffMinutes}m`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSchedule(rule)
                      setScheduleDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this schedule?")) {
                        deleteRuleMutation.mutate(rule.id)
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Days */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Itinerary</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingDay(undefined)
              setDayDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Day
          </Button>
        </CardHeader>
        <CardContent>
          {(!daysData?.data || daysData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No days yet.</p>
          )}

          <div className="flex flex-col gap-2">
            {daysData?.data.map((day) => (
              <DayRow
                key={day.id}
                day={day}
                productId={id}
                expanded={expandedDayId === day.id}
                onToggle={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                onEdit={() => {
                  setEditingDay(day)
                  setDayDialogOpen(true)
                }}
                onDelete={() => {
                  if (confirm("Delete this day and all its services?")) {
                    deleteDayMutation.mutate(day.id)
                  }
                }}
                onAddService={() => {
                  setServiceDialogDayId(day.id)
                  setEditingService(undefined)
                  setServiceDialogOpen(true)
                }}
                onEditService={(svc) => {
                  setServiceDialogDayId(day.id)
                  setEditingService(svc)
                  setServiceDialogOpen(true)
                }}
                onDeleteService={(serviceId) => {
                  if (confirm("Delete this service?")) {
                    deleteServiceMutation.mutate(
                      { dayId: day.id, serviceId },
                      {
                        onSuccess: () => {
                          void queryClient.invalidateQueries({
                            queryKey: ["product-day-services", id, day.id],
                          })
                        },
                      },
                    )
                  }
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <OptionsSection productId={id} />

      {/* Versions */}
      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
        </CardHeader>
        <CardContent>
          {(!versionsData?.data || versionsData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No versions yet.</p>
          )}

          {versionsData?.data.map((version) => (
            <div key={version.id} className="flex items-center gap-4 rounded-md border p-3 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <span className="text-sm font-medium">Version {version.versionNumber}</span>
                {version.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5">{version.notes}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(version.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              className="self-end"
              disabled={!noteContent.trim() || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate(noteContent.trim())}
            >
              {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>

          {notesData?.data.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No notes yet.</p>
          )}

          {notesData?.data.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProductDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        product={product}
        onSuccess={() => {
          setEditOpen(false)
          void queryClient.invalidateQueries({ queryKey: productsQueryKeys.product(id) })
          void queryClient.invalidateQueries({ queryKey: productsQueryKeys.products() })
        }}
      />

      <DayDialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        productId={id}
        day={editingDay}
        nextDayNumber={nextDayNumber}
        onSuccess={() => {
          setDayDialogOpen(false)
          setEditingDay(undefined)
          void refetchDays()
        }}
      />

      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        productId={id}
        dayId={serviceDialogDayId}
        service={editingService}
        onSuccess={() => {
          setServiceDialogOpen(false)
          setEditingService(undefined)
          void queryClient.invalidateQueries({
            queryKey: ["product-day-services", id, serviceDialogDayId],
          })
        }}
      />

      <VersionDialog
        open={versionDialogOpen}
        onOpenChange={setVersionDialogOpen}
        productId={id}
        onSuccess={() => {
          setVersionDialogOpen(false)
          void refetchVersions()
        }}
      />

      <DepartureDialog
        open={departureDialogOpen}
        onOpenChange={setDepartureDialogOpen}
        productId={id}
        slot={editingDeparture}
        onSuccess={() => {
          setDepartureDialogOpen(false)
          setEditingDeparture(undefined)
          void refetchSlots()
        }}
      />

      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        productId={id}
        rule={editingSchedule}
        onSuccess={() => {
          setScheduleDialogOpen(false)
          setEditingSchedule(undefined)
          void refetchRules()
        }}
      />
    </div>
  )
}

// ---------- Day row with expandable services ----------

function DayRow({
  day,
  productId,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddService,
  onEditService,
  onDeleteService,
}: {
  day: ProductDay
  productId: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddService: () => void
  onEditService: (service: DayService) => void
  onDeleteService: (serviceId: string) => void
}) {
  const { data: servicesData } = useQuery({
    queryKey: ["product-day-services", productId, day.id],
    queryFn: () =>
      api.get<{ data: DayService[] }>(`/v1/products/${productId}/days/${day.id}/services`),
    enabled: expanded,
  })

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <span className="text-sm font-medium">
            Day {day.dayNumber}
            {day.title ? `: ${day.title}` : ""}
          </span>
          {day.location && (
            <span className="ml-2 text-xs text-muted-foreground">{day.location}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Services
            </p>
            <Button variant="outline" size="sm" onClick={onAddService}>
              <Plus className="mr-1 h-3 w-3" />
              Add Service
            </Button>
          </div>

          {(!servicesData?.data || servicesData.data.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-2">No services yet.</p>
          )}

          {servicesData?.data && servicesData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Cost</th>
                    <th className="text-left p-2 font-medium">Qty</th>
                    <th className="p-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {servicesData.data.map((svc) => (
                    <tr key={svc.id} className="border-b last:border-b-0">
                      <td className="p-2">{svc.name}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {svc.serviceType}
                        </Badge>
                      </td>
                      <td className="p-2 font-mono">
                        {(svc.costAmountCents / 100).toFixed(2)} {svc.costCurrency}
                      </td>
                      <td className="p-2">{svc.quantity}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditService(svc)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteService(svc.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
