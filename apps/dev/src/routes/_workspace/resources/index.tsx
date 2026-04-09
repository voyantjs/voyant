import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { CalendarDays, ExternalLink, Loader2, Plus, Search, Users, Wrench } from "lucide-react"
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

type SupplierOption = {
  id: string
  name: string
}

type ProductOption = {
  id: string
  name: string
}

type BookingOption = {
  id: string
  bookingNumber: string
}

type SlotOption = {
  id: string
  productId: string
  dateLocal: string
  startsAt: string
}

type RuleOption = {
  id: string
  productId: string
  recurrenceRule: string
}

type StartTimeOption = {
  id: string
  productId: string
  label: string | null
  startTimeLocal: string
}

type ResourceRow = {
  id: string
  supplierId: string | null
  kind: "guide" | "vehicle" | "room" | "boat" | "equipment" | "other"
  name: string
  code: string | null
  capacity: number | null
  active: boolean
  notes: string | null
}

type ResourcePoolRow = {
  id: string
  productId: string | null
  kind: ResourceRow["kind"]
  name: string
  sharedCapacity: number | null
  active: boolean
  notes: string | null
}

type ResourceAllocationRow = {
  id: string
  poolId: string
  productId: string
  availabilityRuleId: string | null
  startTimeId: string | null
  quantityRequired: number
  allocationMode: "shared" | "exclusive"
  priority: number
}

type ResourceSlotAssignmentRow = {
  id: string
  slotId: string
  poolId: string | null
  resourceId: string | null
  bookingId: string | null
  status: "reserved" | "assigned" | "released" | "cancelled" | "completed"
  assignedBy: string | null
  releasedAt: string | null
  notes: string | null
}

type ResourceCloseoutRow = {
  id: string
  resourceId: string
  dateLocal: string
  startsAt: string | null
  endsAt: string | null
  reason: string | null
  createdBy: string | null
}

const NONE_VALUE = "__none__"

const resourceKindOptions = [
  { value: "guide", label: "Guide" },
  { value: "vehicle", label: "Vehicle" },
  { value: "room", label: "Room" },
  { value: "boat", label: "Boat" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
] as const

const allocationModeOptions = [
  { value: "shared", label: "Shared" },
  { value: "exclusive", label: "Exclusive" },
] as const

const assignmentStatusOptions = [
  { value: "reserved", label: "Reserved" },
  { value: "assigned", label: "Assigned" },
  { value: "released", label: "Released" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
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

function labelById(
  options: Array<{ id: string; name?: string; bookingNumber?: string }>,
  id: string | null,
) {
  if (!id) return "-"
  const match = options.find((option) => option.id === id)
  return match?.name ?? match?.bookingNumber ?? id
}

function slotLabel(slot: SlotOption) {
  return `${slot.dateLocal} · ${formatDateTime(slot.startsAt)}`
}

function formatSelectionLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

const resourceColumns = (
  suppliers: SupplierOption[],
  onView: (resourceId: string) => void,
): ColumnDef<ResourceRow>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Resource" />,
  },
  {
    accessorKey: "kind",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kind" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.kind}
      </Badge>
    ),
  },
  {
    accessorKey: "supplierId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
    cell: ({ row }) => labelById(suppliers, row.original.supplierId),
  },
  {
    accessorKey: "capacity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Capacity" />,
    cell: ({ row }) => row.original.capacity ?? "-",
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

const poolColumns = (
  products: ProductOption[],
  onView: (poolId: string) => void,
): ColumnDef<ResourcePoolRow>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pool" />,
  },
  {
    accessorKey: "kind",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kind" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.kind}
      </Badge>
    ),
  },
  {
    accessorKey: "productId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => labelById(products, row.original.productId),
  },
  {
    accessorKey: "sharedCapacity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Shared Capacity" />,
    cell: ({ row }) => row.original.sharedCapacity ?? "-",
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

const allocationColumns = (
  pools: ResourcePoolRow[],
  products: ProductOption[],
  onView: (allocationId: string) => void,
): ColumnDef<ResourceAllocationRow>[] => [
  {
    accessorKey: "poolId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pool" />,
    cell: ({ row }) => labelById(pools, row.original.poolId),
  },
  {
    accessorKey: "productId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => labelById(products, row.original.productId),
  },
  {
    accessorKey: "allocationMode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mode" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.allocationMode}
      </Badge>
    ),
  },
  {
    accessorKey: "quantityRequired",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Qty Required" />,
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
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

const assignmentColumns = (
  slots: SlotOption[],
  resources: ResourceRow[],
  bookings: BookingOption[],
  onView: (assignmentId: string) => void,
): ColumnDef<ResourceSlotAssignmentRow>[] => [
  {
    accessorKey: "slotId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slot" />,
    cell: ({ row }) =>
      slotLabel(
        slots.find((slot) => slot.id === row.original.slotId) ?? {
          id: row.original.slotId,
          productId: "",
          dateLocal: row.original.slotId,
          startsAt: row.original.slotId,
        },
      ),
  },
  {
    accessorKey: "resourceId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Resource" />,
    cell: ({ row }) => labelById(resources, row.original.resourceId),
  },
  {
    accessorKey: "bookingId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
    cell: ({ row }) => labelById(bookings, row.original.bookingId),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "releasedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Released" />,
    cell: ({ row }) => formatDateTime(row.original.releasedAt),
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

const closeoutColumns = (resources: ResourceRow[]): ColumnDef<ResourceCloseoutRow>[] => [
  {
    accessorKey: "resourceId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Resource" />,
    cell: ({ row }) => labelById(resources, row.original.resourceId),
  },
  {
    accessorKey: "dateLocal",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
  },
  {
    accessorKey: "startsAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Starts" />,
    cell: ({ row }) => formatDateTime(row.original.startsAt),
  },
  {
    accessorKey: "endsAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ends" />,
    cell: ({ row }) => formatDateTime(row.original.endsAt),
  },
  {
    accessorKey: "reason",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reason" />,
    cell: ({ row }) => row.original.reason ?? "-",
  },
]

export const Route = createFileRoute("/_workspace/resources/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getResourceSuppliersQueryOptions()),
      context.queryClient.ensureQueryData(getResourceProductsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceBookingsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceSlotsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceRulesQueryOptions()),
      context.queryClient.ensureQueryData(getResourceStartTimesQueryOptions()),
      context.queryClient.ensureQueryData(getResourceResourcesQueryOptions()),
      context.queryClient.ensureQueryData(getResourcePoolsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceAllocationsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceAssignmentsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceCloseoutsQueryOptions()),
    ]),
  component: ResourcesPage,
})

function getResourceSuppliersQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "suppliers"],
    queryFn: () => api.get<ListResponse<SupplierOption>>("/v1/suppliers?limit=200"),
  })
}

function getResourceProductsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "products"],
    queryFn: () => api.get<ListResponse<ProductOption>>("/v1/products?limit=100"),
  })
}

function getResourceBookingsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "bookings"],
    queryFn: () => api.get<ListResponse<BookingOption>>("/v1/bookings?limit=200"),
  })
}

function getResourceSlotsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "slots"],
    queryFn: () => api.get<ListResponse<SlotOption>>("/v1/availability/slots?limit=200"),
  })
}

function getResourceRulesQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "rules"],
    queryFn: () => api.get<ListResponse<RuleOption>>("/v1/availability/rules?limit=200"),
  })
}

function getResourceStartTimesQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "start-times"],
    queryFn: () => api.get<ListResponse<StartTimeOption>>("/v1/availability/start-times?limit=200"),
  })
}

function getResourceResourcesQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "resources"],
    queryFn: () => api.get<ListResponse<ResourceRow>>("/v1/resources/resources?limit=200"),
  })
}

function getResourcePoolsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "pools"],
    queryFn: () => api.get<ListResponse<ResourcePoolRow>>("/v1/resources/pools?limit=200"),
  })
}

function getResourceAllocationsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "allocations"],
    queryFn: () =>
      api.get<ListResponse<ResourceAllocationRow>>("/v1/resources/allocations?limit=200"),
  })
}

function getResourceAssignmentsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "assignments"],
    queryFn: () =>
      api.get<ListResponse<ResourceSlotAssignmentRow>>("/v1/resources/slot-assignments?limit=200"),
  })
}

function getResourceCloseoutsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "closeouts"],
    queryFn: () => api.get<ListResponse<ResourceCloseoutRow>>("/v1/resources/closeouts?limit=200"),
  })
}

function ResourcesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState("all")
  const [bulkActionTarget, setBulkActionTarget] = useState<string | null>(null)
  const [resourceSelection, setResourceSelection] = useState<RowSelectionState>({})
  const [poolSelection, setPoolSelection] = useState<RowSelectionState>({})
  const [allocationSelection, setAllocationSelection] = useState<RowSelectionState>({})
  const [assignmentSelection, setAssignmentSelection] = useState<RowSelectionState>({})
  const [closeoutSelection, setCloseoutSelection] = useState<RowSelectionState>({})
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [poolDialogOpen, setPoolDialogOpen] = useState(false)
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [closeoutDialogOpen, setCloseoutDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceRow | undefined>()
  const [editingPool, setEditingPool] = useState<ResourcePoolRow | undefined>()
  const [editingAllocation, setEditingAllocation] = useState<ResourceAllocationRow | undefined>()
  const [editingAssignment, setEditingAssignment] = useState<
    ResourceSlotAssignmentRow | undefined
  >()
  const [editingCloseout, setEditingCloseout] = useState<ResourceCloseoutRow | undefined>()

  const suppliersQuery = useQuery(getResourceSuppliersQueryOptions())
  const productsQuery = useQuery(getResourceProductsQueryOptions())
  const bookingsQuery = useQuery(getResourceBookingsQueryOptions())
  const slotsQuery = useQuery(getResourceSlotsQueryOptions())
  const rulesQuery = useQuery(getResourceRulesQueryOptions())
  const startTimesQuery = useQuery(getResourceStartTimesQueryOptions())
  const resourcesQuery = useQuery(getResourceResourcesQueryOptions())
  const poolsQuery = useQuery(getResourcePoolsQueryOptions())
  const allocationsQuery = useQuery(getResourceAllocationsQueryOptions())
  const assignmentsQuery = useQuery(getResourceAssignmentsQueryOptions())
  const closeoutsQuery = useQuery(getResourceCloseoutsQueryOptions())

  const suppliers = suppliersQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const bookings = bookingsQuery.data?.data ?? []
  const slots = slotsQuery.data?.data ?? []
  const rules = rulesQuery.data?.data ?? []
  const startTimes = startTimesQuery.data?.data ?? []
  const resources = resourcesQuery.data?.data ?? []
  const pools = poolsQuery.data?.data ?? []
  const allocations = allocationsQuery.data?.data ?? []
  const assignments = assignmentsQuery.data?.data ?? []
  const closeouts = closeoutsQuery.data?.data ?? []
  const normalizedSearch = search.trim().toLowerCase()
  const matchesSearch = (...values: Array<string | number | null | undefined>) =>
    !normalizedSearch ||
    values.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  const matchesKind = (kind: ResourceRow["kind"]) => kindFilter === "all" || kind === kindFilter

  const filteredResources = resources.filter(
    (resource) =>
      matchesKind(resource.kind) &&
      matchesSearch(
        resource.name,
        resource.code,
        resource.kind,
        labelById(suppliers, resource.supplierId),
        resource.notes,
      ),
  )
  const filteredPools = pools.filter(
    (pool) =>
      matchesKind(pool.kind) &&
      matchesSearch(pool.name, pool.kind, labelById(products, pool.productId), pool.notes),
  )
  const filteredAllocations = allocations.filter((allocation) => {
    const pool = pools.find((entry) => entry.id === allocation.poolId)
    return (
      (kindFilter === "all" || pool?.kind === kindFilter) &&
      matchesSearch(
        labelById(pools, allocation.poolId),
        labelById(products, allocation.productId),
        allocation.allocationMode,
        allocation.priority,
        allocation.quantityRequired,
        rules.find((rule) => rule.id === allocation.availabilityRuleId)?.recurrenceRule,
        startTimes.find((startTime) => startTime.id === allocation.startTimeId)?.label,
      )
    )
  })
  const filteredAssignments = assignments.filter((assignment) => {
    const resource = resources.find((entry) => entry.id === assignment.resourceId)
    return (
      (kindFilter === "all" || resource?.kind === kindFilter) &&
      matchesSearch(
        assignment.status,
        assignment.assignedBy,
        assignment.notes,
        labelById(resources, assignment.resourceId),
        labelById(bookings, assignment.bookingId),
        slotLabel(
          slots.find((slot) => slot.id === assignment.slotId) ?? {
            id: assignment.slotId,
            productId: "",
            dateLocal: assignment.slotId,
            startsAt: assignment.slotId,
          },
        ),
      )
    )
  })
  const filteredCloseouts = closeouts.filter((closeout) => {
    const resource = resources.find((entry) => entry.id === closeout.resourceId)
    return (
      (kindFilter === "all" || resource?.kind === kindFilter) &&
      matchesSearch(
        labelById(resources, closeout.resourceId),
        closeout.dateLocal,
        closeout.reason,
        closeout.createdBy,
      )
    )
  })
  const activeResourcesCount = filteredResources.filter((resource) => resource.active).length
  const activePoolsCount = filteredPools.filter((pool) => pool.active).length
  const liveAssignments = filteredAssignments.filter(
    (assignment) => assignment.status === "reserved" || assignment.status === "assigned",
  )
  const resourcesWithoutSupplier = filteredResources.filter((resource) => !resource.supplierId)
  const unassignedReservations = liveAssignments.filter((assignment) => !assignment.resourceId)
  const hasFilters = search.length > 0 || kindFilter !== "all"

  const isLoading =
    suppliersQuery.isPending ||
    productsQuery.isPending ||
    bookingsQuery.isPending ||
    slotsQuery.isPending ||
    rulesQuery.isPending ||
    startTimesQuery.isPending ||
    resourcesQuery.isPending ||
    poolsQuery.isPending ||
    allocationsQuery.isPending ||
    assignmentsQuery.isPending ||
    closeoutsQuery.isPending

  const refreshAll = async () => {
    await Promise.all([
      resourcesQuery.refetch(),
      poolsQuery.refetch(),
      allocationsQuery.refetch(),
      assignmentsQuery.refetch(),
      closeoutsQuery.refetch(),
    ])
  }

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
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Manage assignable guides, vehicles, rooms, pools, and operational closeouts.
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
              title="Active Resources"
              value={activeResourcesCount}
              description="Assignable assets ready for use"
              icon={Wrench}
            />
            <OverviewMetric
              title="Active Pools"
              value={activePoolsCount}
              description="Shared-capacity pools live"
              icon={Users}
            />
            <OverviewMetric
              title="Live Assignments"
              value={liveAssignments.length}
              description="Reserved or assigned slot coverage"
              icon={CalendarDays}
            />
            <OverviewMetric
              title="Closeouts"
              value={closeouts.length}
              description="Active maintenance or conflict blocks"
              icon={ExternalLink}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Assignment Gaps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {unassignedReservations.length === 0 ? (
                  <p className="text-muted-foreground">
                    Every live reservation has a named resource.
                  </p>
                ) : (
                  unassignedReservations.slice(0, 4).map((assignment) => (
                    <button
                      key={assignment.id}
                      type="button"
                      className="block w-full rounded-md border p-3 text-left hover:bg-muted/40"
                      onClick={() =>
                        void navigate({
                          to: "/resources/assignments/$id",
                          params: { id: assignment.id },
                        })
                      }
                    >
                      <div className="font-medium">
                        {slotLabel(
                          slots.find((slot) => slot.id === assignment.slotId) ?? {
                            id: assignment.slotId,
                            productId: "",
                            dateLocal: assignment.slotId,
                            startsAt: assignment.slotId,
                          },
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        Status: {assignment.status} · Booking:{" "}
                        {labelById(bookings, assignment.bookingId)}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Ownership Gaps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {resourcesWithoutSupplier.length === 0 ? (
                  <p className="text-muted-foreground">Every resource is linked to a supplier.</p>
                ) : (
                  resourcesWithoutSupplier.slice(0, 4).map((resource) => (
                    <button
                      key={resource.id}
                      type="button"
                      className="block w-full rounded-md border p-3 text-left hover:bg-muted/40"
                      onClick={() =>
                        void navigate({ to: "/resources/$id", params: { id: resource.id } })
                      }
                    >
                      <div className="font-medium">{resource.name}</div>
                      <div className="text-muted-foreground capitalize">
                        {resource.kind} · Capacity {resource.capacity ?? "-"} · No supplier assigned
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
                  placeholder="Search resources..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={kindFilter} onValueChange={(value) => setKindFilter(value ?? "all")}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="All kinds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All kinds</SelectItem>
                  {resourceKindOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                  setKindFilter("all")
                }}
              >
                Clear Filters
              </Button>
            ) : null}
          </div>

          <Tabs defaultValue="resources">
            <TabsList variant="line">
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="pools">Pools</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="closeouts">Closeouts</TabsTrigger>
            </TabsList>

            <TabsContent value="resources" className="space-y-4">
              <SectionHeader
                title="Resources"
                description="Guides, vehicles, rooms, and other assignable assets."
                actionLabel="New Resource"
                onAction={() => {
                  setEditingResource(undefined)
                  setResourceDialogOpen(true)
                }}
              />
              <DataTable
                columns={resourceColumns(suppliers, (resourceId) => {
                  void navigate({ to: "/resources/$id", params: { id: resourceId } })
                })}
                data={filteredResources}
                emptyMessage="No resources match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={resourceSelection}
                onRowSelectionChange={setResourceSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Activate"
                      confirmLabel="Activate Resources"
                      title={`Activate ${formatSelectionLabel(selectedRows.length, "resource")}?`}
                      description="This makes the selected resources available again for assignment and planning."
                      disabled={bulkActionTarget === "resources-activate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/resources",
                          target: "resources-activate",
                          noun: "resource",
                          payload: { active: true },
                          successVerb: "Activated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Deactivate"
                      confirmLabel="Deactivate Resources"
                      title={`Deactivate ${formatSelectionLabel(selectedRows.length, "resource")}?`}
                      description="This preserves the selected resources but removes them from active operational use."
                      disabled={bulkActionTarget === "resources-deactivate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/resources",
                          target: "resources-deactivate",
                          noun: "resource",
                          payload: { active: false },
                          successVerb: "Deactivated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Resources"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "resource")}?`}
                      description="This permanently removes the selected resources. Use Deactivate if you only need to take them out of rotation."
                      disabled={bulkActionTarget === "resources-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/resources",
                          target: "resources-delete",
                          noun: "resource",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingResource(row.original)
                  setResourceDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="pools" className="space-y-4">
              <SectionHeader
                title="Pools"
                description="Shared capacity groups by product or operational need."
                actionLabel="New Pool"
                onAction={() => {
                  setEditingPool(undefined)
                  setPoolDialogOpen(true)
                }}
              />
              <DataTable
                columns={poolColumns(products, (poolId) => {
                  void navigate({ to: "/resources/pools/$id", params: { id: poolId } })
                })}
                data={filteredPools}
                emptyMessage="No pools match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={poolSelection}
                onRowSelectionChange={setPoolSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Activate"
                      confirmLabel="Activate Pools"
                      title={`Activate ${formatSelectionLabel(selectedRows.length, "pool")}?`}
                      description="This re-enables the selected resource pools for live capacity planning."
                      disabled={bulkActionTarget === "pools-activate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/pools",
                          target: "pools-activate",
                          noun: "pool",
                          payload: { active: true },
                          successVerb: "Activated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Deactivate"
                      confirmLabel="Deactivate Pools"
                      title={`Deactivate ${formatSelectionLabel(selectedRows.length, "pool")}?`}
                      description="This keeps the selected pools for reference but removes them from active planning."
                      disabled={bulkActionTarget === "pools-deactivate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/pools",
                          target: "pools-deactivate",
                          noun: "pool",
                          payload: { active: false },
                          successVerb: "Deactivated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Pools"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "pool")}?`}
                      description="This permanently removes the selected pools and any pool-level grouping they provide."
                      disabled={bulkActionTarget === "pools-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/pools",
                          target: "pools-delete",
                          noun: "pool",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingPool(row.original)
                  setPoolDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="allocations" className="space-y-4">
              <SectionHeader
                title="Allocations"
                description="Attach pools to products, rules, and start times."
                actionLabel="New Allocation"
                onAction={() => {
                  setEditingAllocation(undefined)
                  setAllocationDialogOpen(true)
                }}
              />
              <DataTable
                columns={allocationColumns(pools, products, (allocationId) => {
                  void navigate({ to: "/resources/allocations/$id", params: { id: allocationId } })
                })}
                data={filteredAllocations}
                emptyMessage="No allocations match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={allocationSelection}
                onRowSelectionChange={setAllocationSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Allocations"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "allocation")}?`}
                      description="This permanently removes the selected allocation rules from resource planning."
                      disabled={bulkActionTarget === "allocations-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/allocations",
                          target: "allocations-delete",
                          noun: "allocation",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingAllocation(row.original)
                  setAllocationDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <SectionHeader
                title="Slot Assignments"
                description="Reserve or assign specific resources against live slots and bookings."
                actionLabel="New Assignment"
                onAction={() => {
                  setEditingAssignment(undefined)
                  setAssignmentDialogOpen(true)
                }}
              />
              <DataTable
                columns={assignmentColumns(slots, resources, bookings, (assignmentId) => {
                  void navigate({ to: "/resources/assignments/$id", params: { id: assignmentId } })
                })}
                data={filteredAssignments}
                emptyMessage="No assignments match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={assignmentSelection}
                onRowSelectionChange={setAssignmentSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Assign"
                      confirmLabel="Mark Assigned"
                      title={`Mark ${formatSelectionLabel(selectedRows.length, "assignment")} as assigned?`}
                      description="This marks the selected reservations as actively assigned without deleting any linkage."
                      disabled={bulkActionTarget === "assignments-assigned"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/slot-assignments",
                          target: "assignments-assigned",
                          noun: "assignment",
                          payload: { status: "assigned" },
                          successVerb: "Updated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Release"
                      confirmLabel="Release Assignments"
                      title={`Release ${formatSelectionLabel(selectedRows.length, "assignment")}?`}
                      description="This marks the selected reservations as released while keeping the assignment history intact."
                      disabled={bulkActionTarget === "assignments-released"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/slot-assignments",
                          target: "assignments-released",
                          noun: "assignment",
                          payload: { status: "released" },
                          successVerb: "Released",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Assignments"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "assignment")}?`}
                      description="This permanently removes the selected slot assignments. Use Release if you only need to free the resource."
                      disabled={bulkActionTarget === "assignments-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/slot-assignments",
                          target: "assignments-delete",
                          noun: "assignment",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingAssignment(row.original)
                  setAssignmentDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="closeouts" className="space-y-4">
              <SectionHeader
                title="Resource Closeouts"
                description="Block assets for maintenance, charter use, or operational conflicts."
                actionLabel="New Closeout"
                onAction={() => {
                  setEditingCloseout(undefined)
                  setCloseoutDialogOpen(true)
                }}
              />
              <DataTable
                columns={closeoutColumns(resources)}
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
                      description="This permanently removes the selected closeouts and may return the resources to operational use."
                      disabled={bulkActionTarget === "closeouts-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/resources/closeouts",
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
          </Tabs>
        </>
      )}

      <ResourceDialog
        open={resourceDialogOpen}
        onOpenChange={setResourceDialogOpen}
        resource={editingResource}
        suppliers={suppliers}
        onSuccess={() => {
          setResourceDialogOpen(false)
          setEditingResource(undefined)
          void refreshAll()
        }}
      />
      <ResourcePoolDialog
        open={poolDialogOpen}
        onOpenChange={setPoolDialogOpen}
        pool={editingPool}
        products={products}
        onSuccess={() => {
          setPoolDialogOpen(false)
          setEditingPool(undefined)
          void refreshAll()
        }}
      />
      <ResourceAllocationDialog
        open={allocationDialogOpen}
        onOpenChange={setAllocationDialogOpen}
        allocation={editingAllocation}
        pools={pools}
        products={products}
        rules={rules}
        startTimes={startTimes}
        onSuccess={() => {
          setAllocationDialogOpen(false)
          setEditingAllocation(undefined)
          void refreshAll()
        }}
      />
      <ResourceSlotAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        assignment={editingAssignment}
        slots={slots}
        pools={pools}
        resources={resources}
        bookings={bookings}
        onSuccess={() => {
          setAssignmentDialogOpen(false)
          setEditingAssignment(undefined)
          void refreshAll()
        }}
      />
      <ResourceCloseoutDialog
        open={closeoutDialogOpen}
        onOpenChange={setCloseoutDialogOpen}
        closeout={editingCloseout}
        resources={resources}
        onSuccess={() => {
          setCloseoutDialogOpen(false)
          setEditingCloseout(undefined)
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

const resourceFormSchema = z.object({
  supplierId: z.string().optional(),
  kind: z.enum(["guide", "vehicle", "room", "boat", "equipment", "other"]),
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  capacity: z.string().optional(),
  active: z.boolean(),
  notes: z.string().optional(),
})

function ResourceDialog({
  open,
  onOpenChange,
  resource,
  suppliers,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: ResourceRow
  suppliers: SupplierOption[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      supplierId: NONE_VALUE,
      kind: "guide" as const,
      name: "",
      code: "",
      capacity: "",
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && resource) {
      form.reset({
        supplierId: resource.supplierId ?? NONE_VALUE,
        kind: resource.kind,
        name: resource.name,
        code: resource.code ?? "",
        capacity: resource.capacity?.toString() ?? "",
        active: resource.active,
        notes: resource.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [form, open, resource])

  const isEditing = Boolean(resource)

  const onSubmit = async (values: z.output<typeof resourceFormSchema>) => {
    const payload = {
      supplierId: values.supplierId === NONE_VALUE ? null : values.supplierId,
      kind: values.kind,
      name: values.name,
      code: nullableString(values.code),
      capacity: nullableNumber(values.capacity),
      active: values.active,
      notes: nullableString(values.notes),
    }

    if (isEditing) {
      await api.patch(`/v1/resources/resources/${resource?.id}`, payload)
    } else {
      await api.post("/v1/resources/resources", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Resource" : "New Resource"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Supplier</Label>
              <Select
                value={form.watch("supplierId")}
                onValueChange={(value) => form.setValue("supplierId", value ?? NONE_VALUE)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Kind</Label>
                <Select
                  value={form.watch("kind")}
                  onValueChange={(value) => form.setValue("kind", value as ResourceRow["kind"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceKindOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Guide Anna" />
              </div>
              <div className="grid gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="G-001" />
              </div>
              <div className="grid gap-2">
                <Label>Capacity</Label>
                <Input {...form.register("capacity")} type="number" min={0} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Languages, certifications, maintenance notes..."
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Make this resource available for assignment.
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
              {isEditing ? "Save Resource" : "Create Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const poolFormSchema = z.object({
  productId: z.string().optional(),
  kind: z.enum(["guide", "vehicle", "room", "boat", "equipment", "other"]),
  name: z.string().min(1, "Name is required"),
  sharedCapacity: z.string().optional(),
  active: z.boolean(),
  notes: z.string().optional(),
})

function ResourcePoolDialog({
  open,
  onOpenChange,
  pool,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pool?: ResourcePoolRow
  products: ProductOption[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(poolFormSchema),
    defaultValues: {
      productId: NONE_VALUE,
      kind: "guide" as const,
      name: "",
      sharedCapacity: "",
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && pool) {
      form.reset({
        productId: pool.productId ?? NONE_VALUE,
        kind: pool.kind,
        name: pool.name,
        sharedCapacity: pool.sharedCapacity?.toString() ?? "",
        active: pool.active,
        notes: pool.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [form, open, pool])

  const isEditing = Boolean(pool)

  const onSubmit = async (values: z.output<typeof poolFormSchema>) => {
    const payload = {
      productId: values.productId === NONE_VALUE ? null : values.productId,
      kind: values.kind,
      name: values.name,
      sharedCapacity: nullableNumber(values.sharedCapacity),
      active: values.active,
      notes: nullableString(values.notes),
    }

    if (isEditing) {
      await api.patch(`/v1/resources/pools/${pool?.id}`, payload)
    } else {
      await api.post("/v1/resources/pools", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Pool" : "New Pool"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select
                value={form.watch("productId")}
                onValueChange={(value) => form.setValue("productId", value ?? NONE_VALUE)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No product</SelectItem>
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
                <Label>Kind</Label>
                <Select
                  value={form.watch("kind")}
                  onValueChange={(value) => form.setValue("kind", value as ResourcePoolRow["kind"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceKindOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Morning guide pool" />
              </div>
              <div className="grid gap-2">
                <Label>Shared Capacity</Label>
                <Input {...form.register("sharedCapacity")} type="number" min={0} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Shared allocation assumptions or operating rules..."
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Allow new allocations against this pool.
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
              {isEditing ? "Save Pool" : "Create Pool"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const allocationFormSchema = z.object({
  poolId: z.string().min(1, "Pool is required"),
  productId: z.string().min(1, "Product is required"),
  availabilityRuleId: z.string().optional(),
  startTimeId: z.string().optional(),
  quantityRequired: z.coerce.number().int().min(1),
  allocationMode: z.enum(["shared", "exclusive"]),
  priority: z.coerce.number().int(),
})

function ResourceAllocationDialog({
  open,
  onOpenChange,
  allocation,
  pools,
  products,
  rules,
  startTimes,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  allocation?: ResourceAllocationRow
  pools: ResourcePoolRow[]
  products: ProductOption[]
  rules: RuleOption[]
  startTimes: StartTimeOption[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      poolId: "",
      productId: "",
      availabilityRuleId: NONE_VALUE,
      startTimeId: NONE_VALUE,
      quantityRequired: 1,
      allocationMode: "shared" as const,
      priority: 0,
    },
  })

  useEffect(() => {
    if (open && allocation) {
      form.reset({
        poolId: allocation.poolId,
        productId: allocation.productId,
        availabilityRuleId: allocation.availabilityRuleId ?? NONE_VALUE,
        startTimeId: allocation.startTimeId ?? NONE_VALUE,
        quantityRequired: allocation.quantityRequired,
        allocationMode: allocation.allocationMode,
        priority: allocation.priority,
      })
    } else if (open) {
      form.reset()
    }
  }, [allocation, form, open])

  const selectedProductId = form.watch("productId")
  const filteredRules = rules.filter((rule) => rule.productId === selectedProductId)
  const filteredStartTimes = startTimes.filter(
    (startTime) => startTime.productId === selectedProductId,
  )
  const isEditing = Boolean(allocation)

  const onSubmit = async (values: z.output<typeof allocationFormSchema>) => {
    const payload = {
      poolId: values.poolId,
      productId: values.productId,
      availabilityRuleId:
        values.availabilityRuleId === NONE_VALUE ? null : values.availabilityRuleId,
      startTimeId: values.startTimeId === NONE_VALUE ? null : values.startTimeId,
      quantityRequired: values.quantityRequired,
      allocationMode: values.allocationMode,
      priority: values.priority,
    }

    if (isEditing) {
      await api.patch(`/v1/resources/allocations/${allocation?.id}`, payload)
    } else {
      await api.post("/v1/resources/allocations", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Allocation" : "New Allocation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Pool</Label>
              <Select
                value={form.watch("poolId")}
                onValueChange={(value) => form.setValue("poolId", value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pool" />
                </SelectTrigger>
                <SelectContent>
                  {pools.map((pool) => (
                    <SelectItem key={pool.id} value={pool.id}>
                      {pool.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Product</Label>
              <Select
                value={form.watch("productId")}
                onValueChange={(value) => form.setValue("productId", value ?? "")}
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
                  value={form.watch("availabilityRuleId")}
                  onValueChange={(value) =>
                    form.setValue("availabilityRuleId", value ?? NONE_VALUE)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No rule</SelectItem>
                    {filteredRules.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.recurrenceRule}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Select
                  value={form.watch("startTimeId")}
                  onValueChange={(value) => form.setValue("startTimeId", value ?? NONE_VALUE)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="grid gap-2">
                <Label>Quantity Required</Label>
                <Input {...form.register("quantityRequired")} type="number" min={1} />
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Input {...form.register("priority")} type="number" />
              </div>
              <div className="grid gap-2">
                <Label>Allocation Mode</Label>
                <Select
                  value={form.watch("allocationMode")}
                  onValueChange={(value) =>
                    form.setValue(
                      "allocationMode",
                      value as ResourceAllocationRow["allocationMode"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allocationModeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Allocation" : "Create Allocation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const assignmentFormSchema = z.object({
  slotId: z.string().min(1, "Slot is required"),
  poolId: z.string().optional(),
  resourceId: z.string().optional(),
  bookingId: z.string().optional(),
  status: z.enum(["reserved", "assigned", "released", "cancelled", "completed"]),
  assignedBy: z.string().optional(),
  releasedAt: z.string().optional(),
  notes: z.string().optional(),
})

function ResourceSlotAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  slots,
  pools,
  resources,
  bookings,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: ResourceSlotAssignmentRow
  slots: SlotOption[]
  pools: ResourcePoolRow[]
  resources: ResourceRow[]
  bookings: BookingOption[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      slotId: "",
      poolId: NONE_VALUE,
      resourceId: NONE_VALUE,
      bookingId: NONE_VALUE,
      status: "reserved" as const,
      assignedBy: "",
      releasedAt: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && assignment) {
      form.reset({
        slotId: assignment.slotId,
        poolId: assignment.poolId ?? NONE_VALUE,
        resourceId: assignment.resourceId ?? NONE_VALUE,
        bookingId: assignment.bookingId ?? NONE_VALUE,
        status: assignment.status,
        assignedBy: assignment.assignedBy ?? "",
        releasedAt: toLocalDateTimeInput(assignment.releasedAt),
        notes: assignment.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [assignment, form, open])

  const isEditing = Boolean(assignment)

  const onSubmit = async (values: z.output<typeof assignmentFormSchema>) => {
    const payload = {
      slotId: values.slotId,
      poolId: values.poolId === NONE_VALUE ? null : values.poolId,
      resourceId: values.resourceId === NONE_VALUE ? null : values.resourceId,
      bookingId: values.bookingId === NONE_VALUE ? null : values.bookingId,
      status: values.status,
      assignedBy: nullableString(values.assignedBy),
      releasedAt: toIsoDateTime(values.releasedAt),
      notes: nullableString(values.notes),
    }

    if (isEditing) {
      await api.patch(`/v1/resources/slot-assignments/${assignment?.id}`, payload)
    } else {
      await api.post("/v1/resources/slot-assignments", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Assignment" : "New Assignment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Slot</Label>
              <Select
                value={form.watch("slotId")}
                onValueChange={(value) => form.setValue("slotId", value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select slot" />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slotLabel(slot)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Pool</Label>
                <Select
                  value={form.watch("poolId")}
                  onValueChange={(value) => form.setValue("poolId", value ?? NONE_VALUE)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No pool</SelectItem>
                    {pools.map((pool) => (
                      <SelectItem key={pool.id} value={pool.id}>
                        {pool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Resource</Label>
                <Select
                  value={form.watch("resourceId")}
                  onValueChange={(value) => form.setValue("resourceId", value ?? NONE_VALUE)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No resource</SelectItem>
                    {resources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Booking</Label>
                <Select
                  value={form.watch("bookingId")}
                  onValueChange={(value) => form.setValue("bookingId", value ?? NONE_VALUE)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No booking</SelectItem>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.bookingNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) =>
                    form.setValue("status", value as ResourceSlotAssignmentRow["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assigned By</Label>
                <Input {...form.register("assignedBy")} placeholder="ops-team@voyant.local" />
              </div>
              <div className="grid gap-2">
                <Label>Released At</Label>
                <Input {...form.register("releasedAt")} type="datetime-local" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Crew request, maintenance hold, pairing notes..."
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Assignment" : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const closeoutFormSchema = z.object({
  resourceId: z.string().min(1, "Resource is required"),
  dateLocal: z.string().min(1, "Date is required"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  reason: z.string().optional(),
  createdBy: z.string().optional(),
})

function ResourceCloseoutDialog({
  open,
  onOpenChange,
  closeout,
  resources,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  closeout?: ResourceCloseoutRow
  resources: ResourceRow[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(closeoutFormSchema),
    defaultValues: {
      resourceId: "",
      dateLocal: "",
      startsAt: "",
      endsAt: "",
      reason: "",
      createdBy: "",
    },
  })

  useEffect(() => {
    if (open && closeout) {
      form.reset({
        resourceId: closeout.resourceId,
        dateLocal: closeout.dateLocal,
        startsAt: toLocalDateTimeInput(closeout.startsAt),
        endsAt: toLocalDateTimeInput(closeout.endsAt),
        reason: closeout.reason ?? "",
        createdBy: closeout.createdBy ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [closeout, form, open])

  const isEditing = Boolean(closeout)

  const onSubmit = async (values: z.output<typeof closeoutFormSchema>) => {
    const payload = {
      resourceId: values.resourceId,
      dateLocal: values.dateLocal,
      startsAt: toIsoDateTime(values.startsAt),
      endsAt: toIsoDateTime(values.endsAt),
      reason: nullableString(values.reason),
      createdBy: nullableString(values.createdBy),
    }

    if (isEditing) {
      await api.patch(`/v1/resources/closeouts/${closeout?.id}`, payload)
    } else {
      await api.post("/v1/resources/closeouts", payload)
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
              <Label>Resource</Label>
              <Select
                value={form.watch("resourceId")}
                onValueChange={(value) => form.setValue("resourceId", value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input {...form.register("dateLocal")} type="date" />
              </div>
              <div className="grid gap-2">
                <Label>Starts At</Label>
                <Input {...form.register("startsAt")} type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label>Ends At</Label>
                <Input {...form.register("endsAt")} type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label>Created By</Label>
                <Input {...form.register("createdBy")} placeholder="ops-team@voyant.local" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Reason</Label>
              <Textarea
                {...form.register("reason")}
                placeholder="Maintenance, service blackout, private charter..."
              />
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
