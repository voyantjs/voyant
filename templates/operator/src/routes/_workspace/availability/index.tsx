import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Loader2,
  Package,
  Plus,
  Search,
  Truck,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod/v4"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmActionButton,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  OverviewMetric,
  Select,
  SelectContent,
  SelectItem,
  SelectionActionBar,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/components/ui"
import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type ListResponse<T> = {
  data: T[]
  total: number
  limit: number
  offset: number
}

type BatchMutationResponse<T = unknown> = {
  data?: T[]
  deletedIds?: string[]
  total: number
  succeeded: number
  failed: Array<{ id: string; error: string }>
}

type ProductOption = {
  id: string
  name: string
}

type AvailabilityRuleRow = {
  id: string
  productId: string
  timezone: string
  recurrenceRule: string
  maxCapacity: number
  maxPickupCapacity: number | null
  cutoffMinutes: number | null
  active: boolean
}

type AvailabilityStartTimeRow = {
  id: string
  productId: string
  label: string | null
  startTimeLocal: string
  durationMinutes: number | null
  sortOrder: number
  active: boolean
}

type AvailabilitySlotRow = {
  id: string
  productId: string
  availabilityRuleId: string | null
  startTimeId: string | null
  dateLocal: string
  startsAt: string
  endsAt: string | null
  timezone: string
  status: "open" | "closed" | "sold_out" | "cancelled"
  unlimited: boolean
  initialPax: number | null
  remainingPax: number | null
  notes: string | null
}

type AvailabilityCloseoutRow = {
  id: string
  productId: string
  slotId: string | null
  dateLocal: string
  reason: string | null
  createdBy: string | null
}

type AvailabilityPickupPointRow = {
  id: string
  productId: string
  name: string
  description: string | null
  locationText: string | null
  active: boolean
}

const NONE_VALUE = "__none__"

const slotStatusVariant: Record<
  AvailabilitySlotRow["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  open: "default",
  closed: "secondary",
  sold_out: "destructive",
  cancelled: "outline",
}

const booleanOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const

const slotStatusOptions = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "sold_out", label: "Sold Out" },
  { value: "cancelled", label: "Cancelled" },
] as const

function nullableString(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed ? trimmed : null
}

function nullableNumber(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed ? Number(trimmed) : null
}

function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return ""
  return value.slice(0, 16)
}

function toIsoDateTime(value: string | null | undefined) {
  if (!value) return null
  return new Date(value).toISOString()
}

function formatDateTime(value: string | null) {
  return value ? value.replace("T", " ").slice(0, 16) : "-"
}

function productNameById(products: ProductOption[], productId: string) {
  return products.find((product) => product.id === productId)?.name ?? productId
}

function formatSelectionLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

const ruleColumns = (
  products: ProductOption[],
  onView: (ruleId: string) => void,
): ColumnDef<AvailabilityRuleRow>[] => [
  {
    accessorKey: "productId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => productNameById(products, row.original.productId),
  },
  {
    accessorKey: "timezone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Timezone" />,
  },
  {
    accessorKey: "recurrenceRule",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Recurrence" />,
    cell: ({ row }) => (
      <span className="max-w-[380px] truncate font-mono text-xs">
        {row.original.recurrenceRule}
      </span>
    ),
  },
  {
    accessorKey: "maxCapacity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Max Pax" />,
  },
  {
    accessorKey: "active",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Active" />,
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "secondary"}>
        {row.original.active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "view",
    header: "View",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation()
          onView(row.original.id)
        }}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Open
      </Button>
    ),
  },
]

const startTimeColumns = (
  products: ProductOption[],
  onView: (startTimeId: string) => void,
): ColumnDef<AvailabilityStartTimeRow>[] => [
  {
    accessorKey: "productId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => productNameById(products, row.original.productId),
  },
  {
    accessorKey: "label",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Label" />,
    cell: ({ row }) => row.original.label ?? "-",
  },
  {
    accessorKey: "startTimeLocal",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start" />,
  },
  {
    accessorKey: "durationMinutes",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
    cell: ({ row }) =>
      row.original.durationMinutes == null ? "-" : `${row.original.durationMinutes} min`,
  },
  {
    accessorKey: "active",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "secondary"}>
        {row.original.active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "view",
    header: "View",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation()
          onView(row.original.id)
        }}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Open
      </Button>
    ),
  },
]

const slotColumns = (
  products: ProductOption[],
  onView: (slotId: string) => void,
): ColumnDef<AvailabilitySlotRow>[] => [
  {
    accessorKey: "productId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => productNameById(products, row.original.productId),
  },
  {
    accessorKey: "dateLocal",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
  },
  {
    accessorKey: "startsAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Starts At" />,
    cell: ({ row }) => formatDateTime(row.original.startsAt),
  },
  {
    accessorKey: "remainingPax",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Remaining Pax" />,
    cell: ({ row }) => row.original.remainingPax ?? "-",
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={slotStatusVariant[row.original.status]} className="capitalize">
        {row.original.status.replace("_", " ")}
      </Badge>
    ),
  },
  {
    id: "view",
    header: "View",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation()
          onView(row.original.id)
        }}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Open
      </Button>
    ),
  },
]

const closeoutColumns = (products: ProductOption[]): ColumnDef<AvailabilityCloseoutRow>[] => [
  {
    accessorKey: "productId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => productNameById(products, row.original.productId),
  },
  {
    accessorKey: "dateLocal",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
  },
  {
    accessorKey: "slotId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slot" />,
    cell: ({ row }) => row.original.slotId ?? "Product-level",
  },
  {
    accessorKey: "reason",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reason" />,
    cell: ({ row }) => row.original.reason ?? "-",
  },
]

const pickupPointColumns = (products: ProductOption[]): ColumnDef<AvailabilityPickupPointRow>[] => [
  {
    accessorKey: "productId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => productNameById(products, row.original.productId),
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "locationText",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
    cell: ({ row }) => row.original.locationText ?? "-",
  },
  {
    accessorKey: "active",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "secondary"}>
        {row.original.active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
]

export const Route = createFileRoute("/_workspace/availability/")({
  component: AvailabilityPage,
})

function AvailabilityPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [productFilter, setProductFilter] = useState("all")
  const [bulkActionTarget, setBulkActionTarget] = useState<string | null>(null)
  const [ruleSelection, setRuleSelection] = useState<RowSelectionState>({})
  const [startTimeSelection, setStartTimeSelection] = useState<RowSelectionState>({})
  const [slotSelection, setSlotSelection] = useState<RowSelectionState>({})
  const [closeoutSelection, setCloseoutSelection] = useState<RowSelectionState>({})
  const [pickupPointSelection, setPickupPointSelection] = useState<RowSelectionState>({})
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [startTimeDialogOpen, setStartTimeDialogOpen] = useState(false)
  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [closeoutDialogOpen, setCloseoutDialogOpen] = useState(false)
  const [pickupPointDialogOpen, setPickupPointDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AvailabilityRuleRow | undefined>()
  const [editingStartTime, setEditingStartTime] = useState<AvailabilityStartTimeRow | undefined>()
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlotRow | undefined>()
  const [editingCloseout, setEditingCloseout] = useState<AvailabilityCloseoutRow | undefined>()
  const [editingPickupPoint, setEditingPickupPoint] = useState<
    AvailabilityPickupPointRow | undefined
  >()

  const productsQuery = useQuery({
    queryKey: ["availability", "products"],
    queryFn: () => api.get<ListResponse<ProductOption>>("/v1/products?limit=200"),
  })
  const rulesQuery = useQuery({
    queryKey: ["availability", "rules"],
    queryFn: () => api.get<ListResponse<AvailabilityRuleRow>>("/v1/availability/rules?limit=200"),
  })
  const startTimesQuery = useQuery({
    queryKey: ["availability", "start-times"],
    queryFn: () =>
      api.get<ListResponse<AvailabilityStartTimeRow>>("/v1/availability/start-times?limit=200"),
  })
  const slotsQuery = useQuery({
    queryKey: ["availability", "slots"],
    queryFn: () => api.get<ListResponse<AvailabilitySlotRow>>("/v1/availability/slots?limit=200"),
  })
  const closeoutsQuery = useQuery({
    queryKey: ["availability", "closeouts"],
    queryFn: () =>
      api.get<ListResponse<AvailabilityCloseoutRow>>("/v1/availability/closeouts?limit=200"),
  })
  const pickupPointsQuery = useQuery({
    queryKey: ["availability", "pickup-points"],
    queryFn: () =>
      api.get<ListResponse<AvailabilityPickupPointRow>>("/v1/availability/pickup-points?limit=200"),
  })

  const products = productsQuery.data?.data ?? []
  const rules = rulesQuery.data?.data ?? []
  const startTimes = startTimesQuery.data?.data ?? []
  const slots = slotsQuery.data?.data ?? []
  const closeouts = closeoutsQuery.data?.data ?? []
  const pickupPoints = pickupPointsQuery.data?.data ?? []
  const normalizedSearch = search.trim().toLowerCase()
  const matchesSearch = (...values: Array<string | number | null | undefined>) =>
    !normalizedSearch ||
    values.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  const matchesProduct = (productId: string) =>
    productFilter === "all" || productId === productFilter

  const filteredRules = rules.filter(
    (rule) =>
      matchesProduct(rule.productId) &&
      matchesSearch(productNameById(products, rule.productId), rule.timezone, rule.recurrenceRule),
  )
  const filteredStartTimes = startTimes.filter(
    (startTime) =>
      matchesProduct(startTime.productId) &&
      matchesSearch(
        productNameById(products, startTime.productId),
        startTime.label,
        startTime.startTimeLocal,
      ),
  )
  const filteredSlots = slots.filter(
    (slot) =>
      matchesProduct(slot.productId) &&
      matchesSearch(
        productNameById(products, slot.productId),
        slot.dateLocal,
        slot.startsAt,
        slot.status,
        slot.notes,
      ),
  )
  const filteredCloseouts = closeouts.filter(
    (closeout) =>
      matchesProduct(closeout.productId) &&
      matchesSearch(
        productNameById(products, closeout.productId),
        closeout.dateLocal,
        closeout.slotId,
        closeout.reason,
        closeout.createdBy,
      ),
  )
  const filteredPickupPoints = pickupPoints.filter(
    (pickupPoint) =>
      matchesProduct(pickupPoint.productId) &&
      matchesSearch(
        productNameById(products, pickupPoint.productId),
        pickupPoint.name,
        pickupPoint.locationText,
        pickupPoint.description,
      ),
  )
  const filteredProducts = products.filter(
    (product) => productFilter === "all" || product.id === productFilter,
  )
  const openSlotsCount = filteredSlots.filter((slot) => slot.status === "open").length
  const constrainedSlots = [...filteredSlots]
    .filter((slot) => slot.status === "sold_out" || slot.status === "closed")
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
  const activeRulesCount = filteredRules.filter((rule) => rule.active).length
  const activePickupPointsCount = filteredPickupPoints.filter(
    (pickupPoint) => pickupPoint.active,
  ).length
  const productsWithoutActiveRules = filteredProducts.filter(
    (product) => !filteredRules.some((rule) => rule.productId === product.id && rule.active),
  )
  const hasFilters = search.length > 0 || productFilter !== "all"

  const refreshAll = async () => {
    await Promise.all([
      rulesQuery.refetch(),
      startTimesQuery.refetch(),
      slotsQuery.refetch(),
      closeoutsQuery.refetch(),
      pickupPointsQuery.refetch(),
    ])
  }

  const isLoading =
    productsQuery.isPending ||
    rulesQuery.isPending ||
    startTimesQuery.isPending ||
    slotsQuery.isPending ||
    closeoutsQuery.isPending ||
    pickupPointsQuery.isPending

  const handleBulkUpdate = async ({
    ids,
    endpoint,
    target,
    noun,
    payload,
    successVerb,
    clearSelection,
  }: {
    ids: string[]
    endpoint: string
    target: string
    noun: string
    payload: Record<string, unknown>
    successVerb: string
    clearSelection: () => void
  }) => {
    if (ids.length === 0) return

    setBulkActionTarget(target)

    const result = await api.post<BatchMutationResponse>(`${endpoint}/batch-update`, {
      ids,
      patch: payload,
    })

    await refreshAll()
    clearSelection()
    setBulkActionTarget(null)

    if (result.failed.length === 0) {
      toast.success(`${successVerb} ${formatSelectionLabel(result.succeeded, noun)}.`)
      return
    }

    toast.error(
      `${successVerb} ${result.succeeded} of ${formatSelectionLabel(result.total, noun)}.`,
    )
  }

  const handleBulkDelete = async ({
    ids,
    endpoint,
    target,
    noun,
    clearSelection,
  }: {
    ids: string[]
    endpoint: string
    target: string
    noun: string
    clearSelection: () => void
  }) => {
    if (ids.length === 0) return

    setBulkActionTarget(target)

    const result = await api.post<BatchMutationResponse>(`${endpoint}/batch-delete`, { ids })

    await refreshAll()
    clearSelection()
    setBulkActionTarget(null)

    if (result.failed.length === 0) {
      toast.success(`Deleted ${formatSelectionLabel(result.succeeded, noun)}.`)
      return
    }

    toast.error(`Deleted ${result.succeeded} of ${formatSelectionLabel(result.total, noun)}.`)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Availability</h1>
        <p className="text-sm text-muted-foreground">
          Manage recurrence rules, departures, closeouts, and pickup capacity.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewMetric
              title="Open Slots"
              value={openSlotsCount}
              description="Departures currently bookable"
              icon={CalendarDays}
            />
            <OverviewMetric
              title="Constrained Slots"
              value={constrainedSlots.length}
              description="Closed or sold-out departures"
              icon={Clock3}
            />
            <OverviewMetric
              title="Active Rules"
              value={activeRulesCount}
              description="Recurring operating patterns live"
              icon={Package}
            />
            <OverviewMetric
              title="Pickup Points"
              value={activePickupPointsCount}
              description="Active operational pickup locations"
              icon={Truck}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Capacity Watchlist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {constrainedSlots.length === 0 ? (
                  <p className="text-muted-foreground">No constrained departures right now.</p>
                ) : (
                  constrainedSlots.slice(0, 4).map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      className="block w-full rounded-md border p-3 text-left hover:bg-muted/40"
                      onClick={() =>
                        void navigate({ to: "/availability/$id", params: { id: slot.id } })
                      }
                    >
                      <div className="font-medium">
                        {productNameById(products, slot.productId)} · {slot.dateLocal}
                      </div>
                      <div className="text-muted-foreground">
                        {formatDateTime(slot.startsAt)} · {slot.status.replace("_", " ")} ·
                        Remaining Pax: {slot.remainingPax ?? "-"}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Coverage Gaps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {productsWithoutActiveRules.length === 0 ? (
                  <p className="text-muted-foreground">
                    Every product has at least one active rule.
                  </p>
                ) : (
                  productsWithoutActiveRules.slice(0, 4).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="block w-full rounded-md border p-3 text-left hover:bg-muted/40"
                      onClick={() =>
                        void navigate({ to: "/products/$id", params: { id: product.id } })
                      }
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-muted-foreground">
                        No active availability rule is attached yet.
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search availability..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={productFilter}
                onValueChange={(value) => setProductFilter(value ?? "all")}
                items={[
                  { value: "all", label: "All products" },
                  ...products.map((p) => ({ value: p.id, label: p.name })),
                ]}
              >
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setProductFilter("all")
                }}
              >
                Clear Filters
              </Button>
            ) : null}
          </div>

          <Tabs defaultValue="slots">
            <TabsList variant="line">
              <TabsTrigger value="slots">Slots</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="start-times">Start Times</TabsTrigger>
              <TabsTrigger value="closeouts">Closeouts</TabsTrigger>
              <TabsTrigger value="pickup-points">Pickup Points</TabsTrigger>
            </TabsList>

            <TabsContent value="slots" className="space-y-4">
              <SectionHeader
                title="Departure Slots"
                description="Dated availability instances with live capacity and cutoff state."
                actionLabel="New Slot"
                onAction={() => {
                  setEditingSlot(undefined)
                  setSlotDialogOpen(true)
                }}
              />
              <DataTable
                columns={slotColumns(products, (slotId) => {
                  void navigate({ to: "/availability/$id", params: { id: slotId } })
                })}
                data={filteredSlots}
                emptyMessage="No slots match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={slotSelection}
                onRowSelectionChange={setSlotSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Open"
                      confirmLabel="Open Slots"
                      title={`Open ${formatSelectionLabel(selectedRows.length, "slot")}?`}
                      description="This will mark the selected departures as open and bookable again."
                      disabled={bulkActionTarget === "slots-open"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/slots",
                          target: "slots-open",
                          noun: "slot",
                          payload: { status: "open" },
                          successVerb: "Opened",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Close"
                      confirmLabel="Close Slots"
                      title={`Close ${formatSelectionLabel(selectedRows.length, "slot")}?`}
                      description="This keeps the selected departures in place but stops them from being bookable."
                      disabled={bulkActionTarget === "slots-close"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/slots",
                          target: "slots-close",
                          noun: "slot",
                          payload: { status: "closed" },
                          successVerb: "Closed",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Slots"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "slot")}?`}
                      description="This permanently removes the selected departures. Use Close if you only need to stop new bookings."
                      disabled={bulkActionTarget === "slots-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/slots",
                          target: "slots-delete",
                          noun: "slot",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingSlot(row.original)
                  setSlotDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <SectionHeader
                title="Availability Rules"
                description="Recurring operating patterns, timezone, cutoff, and baseline capacity."
                actionLabel="New Rule"
                onAction={() => {
                  setEditingRule(undefined)
                  setRuleDialogOpen(true)
                }}
              />
              <DataTable
                columns={ruleColumns(products, (ruleId) => {
                  void navigate({ to: "/availability/rules/$id", params: { id: ruleId } })
                })}
                data={filteredRules}
                emptyMessage="No rules match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={ruleSelection}
                onRowSelectionChange={setRuleSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Activate"
                      confirmLabel="Activate Rules"
                      title={`Activate ${formatSelectionLabel(selectedRows.length, "rule")}?`}
                      description="This enables the selected availability rules for scheduling and downstream operations."
                      disabled={bulkActionTarget === "rules-activate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/rules",
                          target: "rules-activate",
                          noun: "rule",
                          payload: { active: true },
                          successVerb: "Activated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Deactivate"
                      confirmLabel="Deactivate Rules"
                      title={`Deactivate ${formatSelectionLabel(selectedRows.length, "rule")}?`}
                      description="This keeps the rules for reference but removes them from active operating coverage."
                      disabled={bulkActionTarget === "rules-deactivate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/rules",
                          target: "rules-deactivate",
                          noun: "rule",
                          payload: { active: false },
                          successVerb: "Deactivated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Rules"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "rule")}?`}
                      description="This permanently removes the selected availability rules and any rule-specific operating setup."
                      disabled={bulkActionTarget === "rules-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/rules",
                          target: "rules-delete",
                          noun: "rule",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingRule(row.original)
                  setRuleDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="start-times" className="space-y-4">
              <SectionHeader
                title="Start Times"
                description="Bookable departure times attached to products."
                actionLabel="New Start Time"
                onAction={() => {
                  setEditingStartTime(undefined)
                  setStartTimeDialogOpen(true)
                }}
              />
              <DataTable
                columns={startTimeColumns(products, (startTimeId) => {
                  void navigate({
                    to: "/availability/start-times/$id",
                    params: { id: startTimeId },
                  })
                })}
                data={filteredStartTimes}
                emptyMessage="No start times match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={startTimeSelection}
                onRowSelectionChange={setStartTimeSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Activate"
                      confirmLabel="Activate Start Times"
                      title={`Activate ${formatSelectionLabel(selectedRows.length, "start time")}?`}
                      description="This makes the selected departure times available again anywhere they are referenced."
                      disabled={bulkActionTarget === "start-times-activate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/start-times",
                          target: "start-times-activate",
                          noun: "start time",
                          payload: { active: true },
                          successVerb: "Activated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Deactivate"
                      confirmLabel="Deactivate Start Times"
                      title={`Deactivate ${formatSelectionLabel(selectedRows.length, "start time")}?`}
                      description="This keeps the selected times for reference but removes them from active operating use."
                      disabled={bulkActionTarget === "start-times-deactivate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/start-times",
                          target: "start-times-deactivate",
                          noun: "start time",
                          payload: { active: false },
                          successVerb: "Deactivated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Start Times"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "start time")}?`}
                      description="This permanently removes the selected departure times from the catalog."
                      disabled={bulkActionTarget === "start-times-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/start-times",
                          target: "start-times-delete",
                          noun: "start time",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingStartTime(row.original)
                  setStartTimeDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="closeouts" className="space-y-4">
              <SectionHeader
                title="Closeouts"
                description="Block product-level or slot-level availability for specific dates."
                actionLabel="New Closeout"
                onAction={() => {
                  setEditingCloseout(undefined)
                  setCloseoutDialogOpen(true)
                }}
              />
              <DataTable
                columns={closeoutColumns(products)}
                data={filteredCloseouts}
                emptyMessage="No closeouts match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={closeoutSelection}
                onRowSelectionChange={setCloseoutSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Closeouts"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "closeout")}?`}
                      description="This permanently removes the selected closeouts and can reopen blocked dates if no other restriction applies."
                      disabled={bulkActionTarget === "closeouts-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/closeouts",
                          target: "closeouts-delete",
                          noun: "closeout",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingCloseout(row.original)
                  setCloseoutDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="pickup-points" className="space-y-4">
              <SectionHeader
                title="Pickup Points"
                description="Operational pickup locations by product."
                actionLabel="New Pickup Point"
                onAction={() => {
                  setEditingPickupPoint(undefined)
                  setPickupPointDialogOpen(true)
                }}
              />
              <DataTable
                columns={pickupPointColumns(products)}
                data={filteredPickupPoints}
                emptyMessage="No pickup points match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={pickupPointSelection}
                onRowSelectionChange={setPickupPointSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Activate"
                      confirmLabel="Activate Pickup Points"
                      title={`Activate ${formatSelectionLabel(selectedRows.length, "pickup point")}?`}
                      description="This makes the selected pickup points available again for operational planning."
                      disabled={bulkActionTarget === "pickup-points-activate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/pickup-points",
                          target: "pickup-points-activate",
                          noun: "pickup point",
                          payload: { active: true },
                          successVerb: "Activated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Deactivate"
                      confirmLabel="Deactivate Pickup Points"
                      title={`Deactivate ${formatSelectionLabel(selectedRows.length, "pickup point")}?`}
                      description="This removes the selected pickup points from active use without deleting their history."
                      disabled={bulkActionTarget === "pickup-points-deactivate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/pickup-points",
                          target: "pickup-points-deactivate",
                          noun: "pickup point",
                          payload: { active: false },
                          successVerb: "Deactivated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Pickup Points"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "pickup point")}?`}
                      description="This permanently removes the selected pickup points from the product setup."
                      disabled={bulkActionTarget === "pickup-points-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/availability/pickup-points",
                          target: "pickup-points-delete",
                          noun: "pickup point",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingPickupPoint(row.original)
                  setPickupPointDialogOpen(true)
                }}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <AvailabilityRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        rule={editingRule}
        products={products}
        onSuccess={() => {
          setRuleDialogOpen(false)
          setEditingRule(undefined)
          void refreshAll()
        }}
      />
      <AvailabilityStartTimeDialog
        open={startTimeDialogOpen}
        onOpenChange={setStartTimeDialogOpen}
        startTime={editingStartTime}
        products={products}
        onSuccess={() => {
          setStartTimeDialogOpen(false)
          setEditingStartTime(undefined)
          void refreshAll()
        }}
      />
      <AvailabilitySlotDialog
        open={slotDialogOpen}
        onOpenChange={setSlotDialogOpen}
        slot={editingSlot}
        products={products}
        rules={rules}
        startTimes={startTimes}
        onSuccess={() => {
          setSlotDialogOpen(false)
          setEditingSlot(undefined)
          void refreshAll()
        }}
      />
      <AvailabilityCloseoutDialog
        open={closeoutDialogOpen}
        onOpenChange={setCloseoutDialogOpen}
        closeout={editingCloseout}
        products={products}
        slots={slots}
        onSuccess={() => {
          setCloseoutDialogOpen(false)
          setEditingCloseout(undefined)
          void refreshAll()
        }}
      />
      <AvailabilityPickupPointDialog
        open={pickupPointDialogOpen}
        onOpenChange={setPickupPointDialogOpen}
        pickupPoint={editingPickupPoint}
        products={products}
        onSuccess={() => {
          setPickupPointDialogOpen(false)
          setEditingPickupPoint(undefined)
          void refreshAll()
        }}
      />
    </div>
  )
}

function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onAction}>
        <Plus className="mr-2 h-4 w-4" />
        {actionLabel}
      </Button>
    </div>
  )
}

const ruleFormSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  timezone: z.string().min(1, "Timezone is required"),
  recurrenceRule: z.string().min(1, "Recurrence rule is required"),
  maxCapacity: z.coerce.number().int().min(0),
  maxPickupCapacity: z.string().optional(),
  minTotalPax: z.string().optional(),
  cutoffMinutes: z.string().optional(),
  earlyBookingLimitMinutes: z.string().optional(),
  active: z.boolean(),
})

type RuleFormValues = z.input<typeof ruleFormSchema>
type RuleFormOutput = z.output<typeof ruleFormSchema>

function AvailabilityRuleDialog({
  open,
  onOpenChange,
  rule,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: AvailabilityRuleRow
  products: ProductOption[]
  onSuccess: () => void
}) {
  const form = useForm<RuleFormValues, unknown, RuleFormOutput>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      productId: "",
      timezone: "Europe/Bucharest",
      recurrenceRule: "FREQ=DAILY;INTERVAL=1",
      maxCapacity: 0,
      maxPickupCapacity: "",
      minTotalPax: "",
      cutoffMinutes: "",
      earlyBookingLimitMinutes: "",
      active: true,
    },
  })

  useEffect(() => {
    if (open && rule) {
      form.reset({
        productId: rule.productId,
        timezone: rule.timezone,
        recurrenceRule: rule.recurrenceRule,
        maxCapacity: rule.maxCapacity,
        maxPickupCapacity: rule.maxPickupCapacity?.toString() ?? "",
        minTotalPax: "",
        cutoffMinutes: rule.cutoffMinutes?.toString() ?? "",
        earlyBookingLimitMinutes: "",
        active: rule.active,
      })
    } else if (open) {
      form.reset()
    }
  }, [form, open, rule])

  const isEditing = Boolean(rule)

  const onSubmit = async (values: RuleFormOutput) => {
    const payload = {
      productId: values.productId,
      timezone: values.timezone,
      recurrenceRule: values.recurrenceRule,
      maxCapacity: values.maxCapacity,
      maxPickupCapacity: nullableNumber(values.maxPickupCapacity),
      minTotalPax: nullableNumber(values.minTotalPax),
      cutoffMinutes: nullableNumber(values.cutoffMinutes),
      earlyBookingLimitMinutes: nullableNumber(values.earlyBookingLimitMinutes),
      active: values.active,
    }

    if (isEditing) {
      await api.patch(`/v1/availability/rules/${rule?.id}`, payload)
    } else {
      await api.post("/v1/availability/rules", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Availability Rule" : "New Availability Rule"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select
                value={form.watch("productId")}
                onValueChange={(value) => form.setValue("productId", value ?? "")}
                items={products.map((p) => ({ value: p.id, label: p.name }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.productId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.productId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Timezone</Label>
                <Input {...form.register("timezone")} placeholder="Europe/Bucharest" />
              </div>
              <div className="grid gap-2">
                <Label>Max Capacity</Label>
                <Input {...form.register("maxCapacity")} type="number" min={0} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Recurrence Rule</Label>
              <Textarea
                {...form.register("recurrenceRule")}
                placeholder="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Max Pickup Capacity</Label>
                <Input {...form.register("maxPickupCapacity")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Minimum Total Pax</Label>
                <Input {...form.register("minTotalPax")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Cutoff Minutes</Label>
                <Input {...form.register("cutoffMinutes")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Early Booking Limit Minutes</Label>
                <Input {...form.register("earlyBookingLimitMinutes")} type="number" min={0} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Use this rule when generating live slots.
                </p>
              </div>
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(checked) => form.setValue("active", checked)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const startTimeFormSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  label: z.string().optional(),
  startTimeLocal: z.string().min(1, "Start time is required"),
  durationMinutes: z.string().optional(),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
})

type StartTimeFormValues = z.input<typeof startTimeFormSchema>
type StartTimeFormOutput = z.output<typeof startTimeFormSchema>

function AvailabilityStartTimeDialog({
  open,
  onOpenChange,
  startTime,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  startTime?: AvailabilityStartTimeRow
  products: ProductOption[]
  onSuccess: () => void
}) {
  const form = useForm<StartTimeFormValues, unknown, StartTimeFormOutput>({
    resolver: zodResolver(startTimeFormSchema),
    defaultValues: {
      productId: "",
      label: "",
      startTimeLocal: "09:00",
      durationMinutes: "",
      sortOrder: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (open && startTime) {
      form.reset({
        productId: startTime.productId,
        label: startTime.label ?? "",
        startTimeLocal: startTime.startTimeLocal,
        durationMinutes: startTime.durationMinutes?.toString() ?? "",
        sortOrder: startTime.sortOrder,
        active: startTime.active,
      })
    } else if (open) {
      form.reset()
    }
  }, [form, open, startTime])

  const isEditing = Boolean(startTime)

  const onSubmit = async (values: StartTimeFormOutput) => {
    const payload = {
      productId: values.productId,
      label: nullableString(values.label),
      startTimeLocal: values.startTimeLocal,
      durationMinutes: nullableNumber(values.durationMinutes),
      sortOrder: values.sortOrder,
      active: values.active,
    }

    if (isEditing) {
      await api.patch(`/v1/availability/start-times/${startTime?.id}`, payload)
    } else {
      await api.post("/v1/availability/start-times", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Start Time" : "New Start Time"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select
                value={form.watch("productId")}
                onValueChange={(value) => form.setValue("productId", value ?? "")}
                items={products.map((p) => ({ value: p.id, label: p.name }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Label</Label>
                <Input {...form.register("label")} placeholder="Morning departure" />
              </div>
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Input {...form.register("startTimeLocal")} type="time" />
              </div>
              <div className="grid gap-2">
                <Label>Duration Minutes</Label>
                <Input {...form.register("durationMinutes")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Sort Order</Label>
                <Input {...form.register("sortOrder")} type="number" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Expose this start time for operational planning.
                </p>
              </div>
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(checked) => form.setValue("active", checked)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Start Time" : "Create Start Time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const slotFormSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  availabilityRuleId: z.string().optional(),
  startTimeId: z.string().optional(),
  dateLocal: z.string().min(1, "Date is required"),
  startsAt: z.string().min(1, "Start datetime is required"),
  endsAt: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  status: z.enum(["open", "closed", "sold_out", "cancelled"]),
  unlimited: z.boolean(),
  initialPax: z.string().optional(),
  remainingPax: z.string().optional(),
  initialPickups: z.string().optional(),
  remainingPickups: z.string().optional(),
  remainingResources: z.string().optional(),
  pastCutoff: z.boolean(),
  tooEarly: z.boolean(),
  notes: z.string().optional(),
})

type SlotFormValues = z.input<typeof slotFormSchema>
type SlotFormOutput = z.output<typeof slotFormSchema>

function AvailabilitySlotDialog({
  open,
  onOpenChange,
  slot,
  products,
  rules,
  startTimes,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot?: AvailabilitySlotRow
  products: ProductOption[]
  rules: AvailabilityRuleRow[]
  startTimes: AvailabilityStartTimeRow[]
  onSuccess: () => void
}) {
  const form = useForm<SlotFormValues, unknown, SlotFormOutput>({
    resolver: zodResolver(slotFormSchema),
    defaultValues: {
      productId: "",
      availabilityRuleId: NONE_VALUE,
      startTimeId: NONE_VALUE,
      dateLocal: "",
      startsAt: "",
      endsAt: "",
      timezone: "Europe/Bucharest",
      status: "open",
      unlimited: false,
      initialPax: "",
      remainingPax: "",
      initialPickups: "",
      remainingPickups: "",
      remainingResources: "",
      pastCutoff: false,
      tooEarly: false,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && slot) {
      form.reset({
        productId: slot.productId,
        availabilityRuleId: slot.availabilityRuleId ?? NONE_VALUE,
        startTimeId: slot.startTimeId ?? NONE_VALUE,
        dateLocal: slot.dateLocal,
        startsAt: toLocalDateTimeInput(slot.startsAt),
        endsAt: toLocalDateTimeInput(slot.endsAt),
        timezone: slot.timezone,
        status: slot.status,
        unlimited: slot.unlimited,
        initialPax: slot.initialPax?.toString() ?? "",
        remainingPax: slot.remainingPax?.toString() ?? "",
        initialPickups: "",
        remainingPickups: "",
        remainingResources: "",
        pastCutoff: false,
        tooEarly: false,
        notes: slot.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [form, open, slot])

  const selectedProductId = form.watch("productId")
  const filteredRules = rules.filter((rule) => rule.productId === selectedProductId)
  const filteredStartTimes = startTimes.filter(
    (startTime) => startTime.productId === selectedProductId,
  )
  const isEditing = Boolean(slot)

  const onSubmit = async (values: SlotFormOutput) => {
    const payload = {
      productId: values.productId,
      availabilityRuleId:
        values.availabilityRuleId === NONE_VALUE ? null : values.availabilityRuleId,
      startTimeId: values.startTimeId === NONE_VALUE ? null : values.startTimeId,
      dateLocal: values.dateLocal,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: toIsoDateTime(values.endsAt),
      timezone: values.timezone,
      status: values.status,
      unlimited: values.unlimited,
      initialPax: nullableNumber(values.initialPax),
      remainingPax: nullableNumber(values.remainingPax),
      initialPickups: nullableNumber(values.initialPickups),
      remainingPickups: nullableNumber(values.remainingPickups),
      remainingResources: nullableNumber(values.remainingResources),
      pastCutoff: values.pastCutoff,
      tooEarly: values.tooEarly,
      notes: nullableString(values.notes),
    }

    if (isEditing) {
      await api.patch(`/v1/availability/slots/${slot?.id}`, payload)
    } else {
      await api.post("/v1/availability/slots", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Slot" : "New Slot"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select
                value={form.watch("productId")}
                onValueChange={(value) => form.setValue("productId", value ?? "")}
                items={products.map((p) => ({ value: p.id, label: p.name }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Rule</Label>
                <Select
                  value={form.watch("availabilityRuleId") ?? NONE_VALUE}
                  onValueChange={(value) =>
                    form.setValue("availabilityRuleId", value ?? NONE_VALUE)
                  }
                  items={[
                    { value: NONE_VALUE, label: "No rule" },
                    ...filteredRules.map((r) => ({
                      value: r.id,
                      label: `${r.timezone} \u00b7 ${r.recurrenceRule}`,
                    })),
                  ]}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No rule</SelectItem>
                    {filteredRules.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.timezone} · {rule.recurrenceRule}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Select
                  value={form.watch("startTimeId") ?? NONE_VALUE}
                  onValueChange={(value) => form.setValue("startTimeId", value ?? NONE_VALUE)}
                  items={[
                    { value: NONE_VALUE, label: "No start time" },
                    ...filteredStartTimes.map((st) => ({
                      value: st.id,
                      label: st.label ?? st.startTimeLocal,
                    })),
                  ]}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional start time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No start time</SelectItem>
                    {filteredStartTimes.map((startTime) => (
                      <SelectItem key={startTime.id} value={startTime.id}>
                        {startTime.label ?? startTime.startTimeLocal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input {...form.register("dateLocal")} type="date" />
              </div>
              <div className="grid gap-2">
                <Label>Timezone</Label>
                <Input {...form.register("timezone")} placeholder="Europe/Bucharest" />
              </div>
              <div className="grid gap-2">
                <Label>Starts At</Label>
                <Input {...form.register("startsAt")} type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label>Ends At</Label>
                <Input {...form.register("endsAt")} type="datetime-local" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) =>
                    form.setValue("status", value as SlotFormOutput["status"])
                  }
                  items={[...slotStatusOptions]}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {slotStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Unlimited</Label>
                <Select
                  value={String(form.watch("unlimited"))}
                  onValueChange={(value) => form.setValue("unlimited", value === "true")}
                  items={[...booleanOptions]}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {booleanOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Initial Pax</Label>
                <Input {...form.register("initialPax")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Remaining Pax</Label>
                <Input {...form.register("remainingPax")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Remaining Resources</Label>
                <Input {...form.register("remainingResources")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Initial Pickups</Label>
                <Input {...form.register("initialPickups")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Remaining Pickups</Label>
                <Input {...form.register("remainingPickups")} type="number" min={0} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Past Cutoff</p>
                  <p className="text-xs text-muted-foreground">Prevent late bookings.</p>
                </div>
                <Switch
                  checked={form.watch("pastCutoff")}
                  onCheckedChange={(checked) => form.setValue("pastCutoff", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Too Early</p>
                  <p className="text-xs text-muted-foreground">Prevent very early bookings.</p>
                </div>
                <Switch
                  checked={form.watch("tooEarly")}
                  onCheckedChange={(checked) => form.setValue("tooEarly", checked)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Operational notes for this slot..."
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Slot" : "Create Slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const closeoutFormSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  slotId: z.string().optional(),
  dateLocal: z.string().min(1, "Date is required"),
  reason: z.string().optional(),
  createdBy: z.string().optional(),
})

type CloseoutFormValues = z.input<typeof closeoutFormSchema>
type CloseoutFormOutput = z.output<typeof closeoutFormSchema>

function AvailabilityCloseoutDialog({
  open,
  onOpenChange,
  closeout,
  products,
  slots,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  closeout?: AvailabilityCloseoutRow
  products: ProductOption[]
  slots: AvailabilitySlotRow[]
  onSuccess: () => void
}) {
  const form = useForm<CloseoutFormValues, unknown, CloseoutFormOutput>({
    resolver: zodResolver(closeoutFormSchema),
    defaultValues: {
      productId: "",
      slotId: NONE_VALUE,
      dateLocal: "",
      reason: "",
      createdBy: "",
    },
  })

  useEffect(() => {
    if (open && closeout) {
      form.reset({
        productId: closeout.productId,
        slotId: closeout.slotId ?? NONE_VALUE,
        dateLocal: closeout.dateLocal,
        reason: closeout.reason ?? "",
        createdBy: closeout.createdBy ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [closeout, form, open])

  const selectedProductId = form.watch("productId")
  const filteredSlots = slots.filter((slot) => slot.productId === selectedProductId)
  const isEditing = Boolean(closeout)

  const onSubmit = async (values: CloseoutFormOutput) => {
    const payload = {
      productId: values.productId,
      slotId: values.slotId === NONE_VALUE ? null : values.slotId,
      dateLocal: values.dateLocal,
      reason: nullableString(values.reason),
      createdBy: nullableString(values.createdBy),
    }

    if (isEditing) {
      await api.patch(`/v1/availability/closeouts/${closeout?.id}`, payload)
    } else {
      await api.post("/v1/availability/closeouts", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Closeout" : "New Closeout"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select
                value={form.watch("productId")}
                onValueChange={(value) => form.setValue("productId", value ?? "")}
                items={products.map((p) => ({ value: p.id, label: p.name }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Slot</Label>
              <Select
                value={form.watch("slotId") ?? NONE_VALUE}
                onValueChange={(value) => form.setValue("slotId", value ?? NONE_VALUE)}
                items={[
                  { value: NONE_VALUE, label: "Product-level closeout" },
                  ...filteredSlots.map((s) => ({
                    value: s.id,
                    label: `${s.dateLocal} \u00b7 ${formatDateTime(s.startsAt)}`,
                  })),
                ]}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Product-level closeout</SelectItem>
                  {filteredSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.dateLocal} · {formatDateTime(slot.startsAt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input {...form.register("dateLocal")} type="date" />
            </div>
            <div className="grid gap-2">
              <Label>Reason</Label>
              <Textarea
                {...form.register("reason")}
                placeholder="Weather, charter hold, operational blackout..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Created By</Label>
              <Input {...form.register("createdBy")} placeholder="ops-team@voyant.local" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Closeout" : "Create Closeout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const pickupPointFormSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  locationText: z.string().optional(),
  active: z.boolean(),
})

type PickupPointFormValues = z.input<typeof pickupPointFormSchema>
type PickupPointFormOutput = z.output<typeof pickupPointFormSchema>

function AvailabilityPickupPointDialog({
  open,
  onOpenChange,
  pickupPoint,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pickupPoint?: AvailabilityPickupPointRow
  products: ProductOption[]
  onSuccess: () => void
}) {
  const form = useForm<PickupPointFormValues, unknown, PickupPointFormOutput>({
    resolver: zodResolver(pickupPointFormSchema),
    defaultValues: {
      productId: "",
      name: "",
      description: "",
      locationText: "",
      active: true,
    },
  })

  useEffect(() => {
    if (open && pickupPoint) {
      form.reset({
        productId: pickupPoint.productId,
        name: pickupPoint.name,
        description: pickupPoint.description ?? "",
        locationText: pickupPoint.locationText ?? "",
        active: pickupPoint.active,
      })
    } else if (open) {
      form.reset()
    }
  }, [form, open, pickupPoint])

  const isEditing = Boolean(pickupPoint)

  const onSubmit = async (values: PickupPointFormOutput) => {
    const payload = {
      productId: values.productId,
      name: values.name,
      description: nullableString(values.description),
      locationText: nullableString(values.locationText),
      active: values.active,
    }

    if (isEditing) {
      await api.patch(`/v1/availability/pickup-points/${pickupPoint?.id}`, payload)
    } else {
      await api.post("/v1/availability/pickup-points", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Pickup Point" : "New Pickup Point"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select
                value={form.watch("productId")}
                onValueChange={(value) => form.setValue("productId", value ?? "")}
                items={products.map((p) => ({ value: p.id, label: p.name }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Port Gate A" />
            </div>
            <div className="grid gap-2">
              <Label>Location Text</Label>
              <Input {...form.register("locationText")} placeholder="Main harbor pickup lane" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                {...form.register("description")}
                placeholder="Instructions, landmark notes, timing..."
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Allow this pickup point to be used in slot planning.
                </p>
              </div>
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(checked) => form.setValue("active", checked)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Pickup Point" : "Create Pickup Point"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
