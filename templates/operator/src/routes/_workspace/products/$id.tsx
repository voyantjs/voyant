import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { describeRRule } from "@voyantjs/availability/rrule"
import {
  defaultFetcher,
  getProductQueryOptions,
  productsQueryKeys,
  useProduct,
} from "@voyantjs/products-react"
import {
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
} from "lucide-react"
import { useRef, useState } from "react"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui"
import { Separator } from "@/components/ui/separator"

import { api } from "@/lib/api-client"
import { getApiUrl } from "@/lib/env"

import { DayDialog } from "./_components/day-dialog"
import { DepartureDialog, type DepartureSlot } from "./_components/departure-dialog"
import { OptionsSection } from "./_components/options-section"
import { ProductDialog } from "./_components/product-dialog"
import { type AvailabilityRule, ScheduleDialog } from "./_components/schedule-dialog"
import { ServiceDialog } from "./_components/service-dialog"

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

type ChannelInfo = {
  id: string
  name: string
  kind: string
  status: string
}

type ChannelProductMapping = {
  id: string
  channelId: string
  productId: string
  active: boolean
}

type ProductMediaItem = {
  id: string
  productId: string
  dayId: string | null
  mediaType: "image" | "video" | "document"
  name: string
  url: string
  storageKey: string | null
  mimeType: string | null
  fileSize: number | null
  altText: string | null
  sortOrder: number
  isCover: boolean
  createdAt: string
  updatedAt: string
}

export const Route = createFileRoute("/_workspace/products/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      getProductQueryOptions({ baseUrl: getApiUrl(), fetcher: defaultFetcher }, params.id),
    ),
  component: ProductDetailPage,
})

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  active: "default",
  archived: "secondary",
}

// ---------- Helpers ----------

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
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

function formatSlotDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
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

// ---------- Layout primitives ----------

function Section({
  title,
  actions,
  children,
  contentClassName,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
}) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="font-semibold leading-none tracking-tight">{title}</h2>
        {actions}
      </div>
      <Separator />
      <div className={contentClassName ?? "px-6 py-4"}>{children}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm [&:not(:last-child)]:border-b">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function ActionMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>
}

// ---------- Main page ----------

function ProductDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [dayDialogOpen, setDayDialogOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<ProductDay | undefined>()
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [serviceDialogDayId, setServiceDialogDayId] = useState<string>("")
  const [editingService, setEditingService] = useState<DayService | undefined>()
  const [departureDialogOpen, setDepartureDialogOpen] = useState(false)
  const [editingDeparture, setEditingDeparture] = useState<DepartureSlot | undefined>()
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AvailabilityRule | undefined>()

  const { data: product, isPending } = useProduct(id)

  const { data: daysData, refetch: refetchDays } = useQuery({
    queryKey: ["product-days", id],
    queryFn: () => api.get<{ data: ProductDay[] }>(`/v1/products/${id}/days`),
  })

  const { data: slotsData, refetch: refetchSlots } = useQuery({
    queryKey: ["product-slots", id],
    queryFn: () =>
      api.get<{ data: DepartureSlot[] }>(`/v1/availability/slots?productId=${id}&limit=200`),
  })

  const { data: rulesData, refetch: refetchRules } = useQuery({
    queryKey: ["product-rules", id],
    queryFn: () =>
      api.get<{ data: AvailabilityRule[] }>(`/v1/availability/rules?productId=${id}&limit=50`),
  })

  const { data: allChannelsData } = useQuery({
    queryKey: ["channels"],
    queryFn: () => api.get<{ data: ChannelInfo[] }>("/v1/distribution/channels?limit=200"),
  })

  const { data: productMappingsData, refetch: refetchMappings } = useQuery({
    queryKey: ["product-channel-mappings", id],
    queryFn: () =>
      api.get<{ data: ChannelProductMapping[] }>(
        `/v1/distribution/product-mappings?productId=${id}&limit=200`,
      ),
  })

  const { data: mediaData, refetch: refetchMedia } = useQuery({
    queryKey: ["product-media", id],
    queryFn: () =>
      api.get<{ data: ProductMediaItem[]; total: number }>(`/v1/products/${id}/media?limit=50`),
  })

  const addChannelMappingMutation = useMutation({
    mutationFn: (channelId: string) =>
      api.post("/v1/distribution/product-mappings", {
        channelId,
        productId: id,
        active: true,
      }),
    onSuccess: () => void refetchMappings(),
  })

  const removeChannelMappingMutation = useMutation({
    mutationFn: (mappingId: string) => api.delete(`/v1/distribution/product-mappings/${mappingId}`),
    onSuccess: () => void refetchMappings(),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/products/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      void navigate({ to: "/products" })
    },
  })

  const deleteDayMutation = useMutation({
    mutationFn: (dayId: string) => api.delete(`/v1/products/${id}/days/${dayId}`),
    onSuccess: () => void refetchDays(),
  })

  const deleteServiceMutation = useMutation({
    mutationFn: ({ dayId, serviceId }: { dayId: string; serviceId: string }) =>
      api.delete(`/v1/products/${id}/days/${dayId}/services/${serviceId}`),
  })

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => api.delete(`/v1/availability/slots/${slotId}`),
    onSuccess: () => void refetchSlots(),
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => api.delete(`/v1/availability/rules/${ruleId}`),
    onSuccess: () => void refetchRules(),
  })

  const convertToBookingMutation = useMutation({
    mutationFn: () => {
      const now = new Date()
      const y = now.getFullYear().toString().slice(-2)
      const m = String(now.getMonth() + 1).padStart(2, "0")
      const seq = String(Math.floor(Math.random() * 9000) + 1000)
      return api.post<{ data: { id: string } }>("/v1/bookings/from-product", {
        productId: id,
        bookingNumber: `BK-${y}${m}-${seq}`,
      })
    },
    onSuccess: (result) => {
      void navigate({ to: "/bookings/$id", params: { id: result.data.id } })
    },
  })

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ file, dayId }: { file: File; dayId?: string }) => {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/v1/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const upload = (await uploadRes.json()) as {
        key: string
        url: string
        mimeType: string
        size: number
      }

      const mediaType = upload.mimeType.startsWith("video/")
        ? "video"
        : upload.mimeType.startsWith("image/")
          ? "image"
          : "document"

      const endpoint = dayId ? `/v1/products/${id}/days/${dayId}/media` : `/v1/products/${id}/media`

      return api.post(endpoint, {
        mediaType,
        name: file.name,
        url: upload.url,
        storageKey: upload.key,
        mimeType: upload.mimeType,
        fileSize: upload.size,
      })
    },
    onSuccess: () => void refetchMedia(),
  })

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) => api.delete(`/v1/products/media/${mediaId}`),
    onSuccess: () => void refetchMedia(),
  })

  const setCoverMutation = useMutation({
    mutationFn: (mediaId: string) => api.patch(`/v1/products/media/${mediaId}/set-cover`, {}),
    onSuccess: () => void refetchMedia(),
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
  const slots = slotsData?.data ?? []
  const rules = rulesData?.data ?? []
  const days = daysData?.data ?? []
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/products" className="transition-colors hover:text-foreground">
          Products
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-normal text-foreground">{product.name}</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <Badge variant={statusVariant[product.status] ?? "secondary"} className="capitalize">
            {product.status}
          </Badge>
        </div>
        <ActionMenu>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={convertToBookingMutation.isPending}
            onClick={() => {
              if (confirm("Convert this product to a booking?")) {
                convertToBookingMutation.mutate()
              }
            }}
          >
            <CalendarCheck className="h-4 w-4" />
            Convert to Booking
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (confirm("Are you sure you want to delete this product?")) {
                deleteMutation.mutate()
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </ActionMenu>
      </div>

      {/* Content — two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Left column (main) ── */}
        <div className="flex flex-col gap-6">
          {/* Product Details */}
          <Section
            title="Product Details"
            actions={
              <ActionMenu>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </ActionMenu>
            }
          >
            {product.description && (
              <div className="border-b pb-3 text-sm text-muted-foreground whitespace-pre-line">
                {product.description}
              </div>
            )}
            {product.sellAmountCents != null && (
              <DetailRow
                label="Sell"
                value={
                  <span className="font-mono">
                    {formatAmount(product.sellAmountCents, product.sellCurrency)}
                  </span>
                }
              />
            )}
            {product.costAmountCents != null && (
              <DetailRow
                label="Cost"
                value={
                  <span className="font-mono">
                    {formatAmount(product.costAmountCents, product.sellCurrency)}
                  </span>
                }
              />
            )}
            {product.marginPercent != null && (
              <DetailRow
                label="Margin"
                value={<span className="font-mono">{formatMargin(product.marginPercent)}</span>}
              />
            )}
            <DetailRow
              label="Currency"
              value={<span className="font-mono">{product.sellCurrency}</span>}
            />
          </Section>

          {/* Departures */}
          <Section
            title="Departures"
            actions={
              <ActionMenu>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingDeparture(undefined)
                    setDepartureDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New Departure
                </DropdownMenuItem>
              </ActionMenu>
            }
            contentClassName=""
          >
            {slots.length === 0 ? (
              <EmptyState message="No departures yet. Add a departure or create a recurring schedule." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2.5 pl-6 pr-3 text-left font-medium">Start</th>
                    <th className="px-3 py-2.5 text-left font-medium">End</th>
                    <th className="px-3 py-2.5 text-left font-medium">Duration</th>
                    <th className="px-3 py-2.5 text-left font-medium">Status</th>
                    <th className="px-3 py-2.5 text-left font-medium">Capacity</th>
                    <th className="w-10 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot.id} className="border-b last:border-b-0">
                      <td className="py-2.5 pl-6 pr-3">
                        <div className="font-mono text-xs">{slot.dateLocal}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatSlotTime(slot.startsAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
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
                      <td className="px-3 py-2.5 text-xs">{formatDuration(slot)}</td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={slotStatusVariant[slot.status]}
                          className="text-xs capitalize"
                        >
                          {slot.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">{formatCapacity(slot)}</td>
                      <td className="px-3 py-2.5">
                        <ActionMenu>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingDeparture(slot)
                              setDepartureDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Delete this departure?")) {
                                deleteSlotMutation.mutate(slot.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </ActionMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* Recurring Schedules */}
          <Section
            title="Recurring Schedules"
            actions={
              <ActionMenu>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingSchedule(undefined)
                    setScheduleDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New Schedule
                </DropdownMenuItem>
              </ActionMenu>
            }
          >
            {rules.length === 0 ? (
              <EmptyState message="No recurring schedules. Define a rule to auto-generate departures." />
            ) : (
              <div className="flex flex-col divide-y">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {describeRRule(rule.recurrenceRule)}
                        </span>
                        {!rule.active && (
                          <Badge variant="outline" className="text-xs">
                            inactive
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Max {rule.maxCapacity} pax · {rule.timezone}
                        {rule.cutoffMinutes != null && ` · cutoff ${rule.cutoffMinutes}m`}
                      </p>
                    </div>
                    <ActionMenu>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingSchedule(rule)
                          setScheduleDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Delete this schedule?")) {
                            deleteRuleMutation.mutate(rule.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </ActionMenu>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Itinerary */}
          <Section
            title="Itinerary"
            actions={
              <ActionMenu>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingDay(undefined)
                    setDayDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Day
                </DropdownMenuItem>
              </ActionMenu>
            }
          >
            {days.length === 0 ? (
              <EmptyState message="No days yet. Add a day to build the itinerary." />
            ) : (
              <div className="flex flex-col gap-2">
                {days.map((day) => (
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
                    onUploadMedia={(file) =>
                      uploadMediaMutation.mutate(
                        { file, dayId: day.id },
                        {
                          onSuccess: () =>
                            void queryClient.invalidateQueries({
                              queryKey: ["day-media", id, day.id],
                            }),
                        },
                      )
                    }
                    isUploadingMedia={uploadMediaMutation.isPending}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Options */}
          <OptionsSection productId={id} />
        </div>

        {/* ── Right column (sidebar) ── */}
        <div className="flex flex-col gap-6">
          {/* Sales Channels */}
          <Section title="Channels">
            {(() => {
              const allChannels = allChannelsData?.data ?? []
              const mappings = productMappingsData?.data ?? []
              const assignedChannelIds = new Set(mappings.map((m) => m.channelId))
              const assignedChannels = allChannels.filter((ch) => assignedChannelIds.has(ch.id))
              const unassignedChannels = allChannels.filter(
                (ch) => !assignedChannelIds.has(ch.id) && ch.status === "active",
              )

              return (
                <div className="flex flex-col gap-3">
                  {assignedChannels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Not assigned to any channels yet.
                    </p>
                  ) : (
                    <div className="flex flex-col divide-y">
                      {assignedChannels.map((ch) => {
                        const mapping = mappings.find((m) => m.channelId === ch.id)
                        return (
                          <div
                            key={ch.id}
                            className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{ch.name}</span>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {ch.kind.replace("_", " ")}
                              </Badge>
                            </div>
                            {mapping && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => removeChannelMappingMutation.mutate(mapping.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {unassignedChannels.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add Channel
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {unassignedChannels.map((ch) => (
                          <DropdownMenuItem
                            key={ch.id}
                            onClick={() => addChannelMappingMutation.mutate(ch.id)}
                          >
                            {ch.name}
                            <span className="ml-auto text-xs text-muted-foreground capitalize">
                              {ch.kind.replace("_", " ")}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {allChannels.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No channels defined yet.{" "}
                      <Link to="/settings/channels" className="underline">
                        Create channels in Settings
                      </Link>
                    </p>
                  )}
                </div>
              )
            })()}
          </Section>

          {/* Organize */}
          <Section
            title="Organize"
            actions={
              <ActionMenu>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </ActionMenu>
            }
          >
            <DetailRow
              label="Tags"
              value={
                product.tags.length > 0 ? (
                  <div className="flex flex-wrap justify-end gap-1">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )
              }
            />
            <DetailRow
              label="Type"
              value={<span className="capitalize">{product.bookingMode.replace("_", " ")}</span>}
            />
          </Section>

          {/* Media */}
          <MediaSection
            media={mediaData?.data ?? []}
            isUploading={uploadMediaMutation.isPending}
            onUpload={(file) => uploadMediaMutation.mutate({ file })}
            onSetCover={(mediaId) => setCoverMutation.mutate(mediaId)}
            onDelete={(mediaId) => {
              if (confirm("Delete this media?")) {
                deleteMediaMutation.mutate(mediaId)
              }
            }}
          />
        </div>
      </div>

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
  onUploadMedia,
  isUploadingMedia,
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
  onUploadMedia: (file: File) => void
  isUploadingMedia: boolean
}) {
  const dayMediaInputRef = useRef<HTMLInputElement>(null)

  const { data: servicesData } = useQuery({
    queryKey: ["product-day-services", productId, day.id],
    queryFn: () =>
      api.get<{ data: DayService[] }>(`/v1/products/${productId}/days/${day.id}/services`),
    enabled: expanded,
  })

  const { data: dayMediaData } = useQuery({
    queryKey: ["day-media", productId, day.id],
    queryFn: () =>
      api.get<{ data: ProductMediaItem[]; total: number }>(
        `/v1/products/${productId}/days/${day.id}/media?limit=50`,
      ),
    enabled: expanded,
  })

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium">
            Day {day.dayNumber}
            {day.title ? `: ${day.title}` : ""}
          </span>
          {day.location && (
            <span className="ml-2 text-xs text-muted-foreground">{day.location}</span>
          )}
        </div>
        <ActionMenu>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddService}>
            <Plus className="h-4 w-4" />
            Add Service
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </ActionMenu>
      </div>

      {expanded && (
        <div className="border-t">
          {!servicesData?.data || servicesData.data.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No services yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="py-2 pl-4 pr-3 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Cost</th>
                  <th className="px-3 py-2 text-left font-medium">Qty</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {servicesData.data.map((svc) => (
                  <tr key={svc.id} className="border-b last:border-b-0">
                    <td className="py-2 pl-4 pr-3">{svc.name}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {svc.serviceType}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {(svc.costAmountCents / 100).toFixed(2)} {svc.costCurrency}
                    </td>
                    <td className="px-3 py-2">{svc.quantity}</td>
                    <td className="px-3 py-2">
                      <ActionMenu>
                        <DropdownMenuItem onClick={() => onEditService(svc)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteService(svc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </ActionMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Day Media */}
          <div className="border-t px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Photos</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                disabled={isUploadingMedia}
                onClick={() => dayMediaInputRef.current?.click()}
              >
                {isUploadingMedia ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <ImagePlus className="mr-1 h-3 w-3" />
                )}
                Add
              </Button>
              <input
                ref={dayMediaInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    onUploadMedia(file)
                    e.target.value = ""
                  }
                }}
              />
            </div>
            {dayMediaData?.data && dayMediaData.data.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dayMediaData.data.map((m) => (
                  <div
                    key={m.id}
                    className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border"
                  >
                    {m.mediaType === "image" ? (
                      <img
                        src={m.url}
                        alt={m.altText ?? m.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                        {m.mediaType}
                      </div>
                    )}
                    {m.isCover && (
                      <div className="absolute top-0.5 left-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No photos for this day.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Media section (product-level) ----------

function MediaSection({
  media,
  isUploading,
  onUpload,
  onSetCover,
  onDelete,
}: {
  media: ProductMediaItem[]
  isUploading: boolean
  onUpload: (file: File) => void
  onSetCover: (mediaId: string) => void
  onDelete: (mediaId: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Section
      title="Media"
      actions={
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-3.5 w-3.5" />
          )}
          Upload
        </Button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            onUpload(file)
            e.target.value = ""
          }
        }}
      />
      {media.length === 0 ? (
        <EmptyState message="No media yet. Upload images or videos." />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {media.map((m) => (
            <div
              key={m.id}
              className="group relative aspect-square overflow-hidden rounded-md border"
            >
              {m.mediaType === "image" ? (
                <img src={m.url} alt={m.altText ?? m.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  {m.mediaType}
                </div>
              )}
              {m.isCover && (
                <div className="absolute top-1 left-1">
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    <Star className="mr-0.5 h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    Cover
                  </Badge>
                </div>
              )}
              <div className="absolute inset-0 flex items-end justify-center gap-1 bg-black/0 pb-1.5 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                {!m.isCover && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onSetCover(m.id)}
                    title="Set as cover"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onDelete(m.id)}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
