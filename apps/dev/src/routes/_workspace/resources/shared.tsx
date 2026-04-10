import { queryOptions } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLink } from "lucide-react"
import { Badge, Button } from "@/components/ui"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { api } from "@/lib/api-client"

export type ListResponse<T> = {
  data: T[]
  total: number
  limit: number
  offset: number
}

export type BatchMutationResponse<T = unknown> = {
  data?: T[]
  deletedIds?: string[]
  total: number
  succeeded: number
  failed: Array<{ id: string; error: string }>
}

export type SupplierOption = {
  id: string
  name: string
}

export type ProductOption = {
  id: string
  name: string
}

export type BookingOption = {
  id: string
  bookingNumber: string
}

export type SlotOption = {
  id: string
  productId: string
  dateLocal: string
  startsAt: string
}

export type RuleOption = {
  id: string
  productId: string
  recurrenceRule: string
}

export type StartTimeOption = {
  id: string
  productId: string
  label: string | null
  startTimeLocal: string
}

export type ResourceRow = {
  id: string
  supplierId: string | null
  kind: "guide" | "vehicle" | "room" | "boat" | "equipment" | "other"
  name: string
  code: string | null
  capacity: number | null
  active: boolean
  notes: string | null
}

export type ResourcePoolRow = {
  id: string
  productId: string | null
  kind: ResourceRow["kind"]
  name: string
  sharedCapacity: number | null
  active: boolean
  notes: string | null
}

export type ResourceAllocationRow = {
  id: string
  poolId: string
  productId: string
  availabilityRuleId: string | null
  startTimeId: string | null
  quantityRequired: number
  allocationMode: "shared" | "exclusive"
  priority: number
}

export type ResourceSlotAssignmentRow = {
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

export type ResourceCloseoutRow = {
  id: string
  resourceId: string
  dateLocal: string
  startsAt: string | null
  endsAt: string | null
  reason: string | null
  createdBy: string | null
}

export const NONE_VALUE = "__none__"

export const resourceKindOptions = [
  { value: "guide", label: "Guide" },
  { value: "vehicle", label: "Vehicle" },
  { value: "room", label: "Room" },
  { value: "boat", label: "Boat" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
] as const

export const allocationModeOptions = [
  { value: "shared", label: "Shared" },
  { value: "exclusive", label: "Exclusive" },
] as const

export const assignmentStatusOptions = [
  { value: "reserved", label: "Reserved" },
  { value: "assigned", label: "Assigned" },
  { value: "released", label: "Released" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
] as const

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
  options: Array<{ id: string; name?: string; bookingNumber?: string }>,
  id: string | null,
) {
  if (!id) return "-"
  const match = options.find((option) => option.id === id)
  return match?.name ?? match?.bookingNumber ?? id
}

export function slotLabel(slot: SlotOption) {
  return `${slot.dateLocal} · ${formatDateTime(slot.startsAt)}`
}

export function formatSelectionLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export const resourceColumns = (
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

export const poolColumns = (
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

export const allocationColumns = (
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

export const assignmentColumns = (
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

export const closeoutColumns = (resources: ResourceRow[]): ColumnDef<ResourceCloseoutRow>[] => [
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

export function getResourceSuppliersQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "suppliers"],
    queryFn: () => api.get<ListResponse<SupplierOption>>("/v1/suppliers?limit=200"),
  })
}

export function getResourceProductsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "products"],
    queryFn: () => api.get<ListResponse<ProductOption>>("/v1/products?limit=100"),
  })
}

export function getResourceBookingsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "bookings"],
    queryFn: () => api.get<ListResponse<BookingOption>>("/v1/bookings?limit=200"),
  })
}

export function getResourceSlotsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "slots"],
    queryFn: () => api.get<ListResponse<SlotOption>>("/v1/availability/slots?limit=200"),
  })
}

export function getResourceRulesQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "rules"],
    queryFn: () => api.get<ListResponse<RuleOption>>("/v1/availability/rules?limit=200"),
  })
}

export function getResourceStartTimesQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "start-times"],
    queryFn: () => api.get<ListResponse<StartTimeOption>>("/v1/availability/start-times?limit=200"),
  })
}

export function getResourceResourcesQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "resources"],
    queryFn: () => api.get<ListResponse<ResourceRow>>("/v1/resources/resources?limit=200"),
  })
}

export function getResourcePoolsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "pools"],
    queryFn: () => api.get<ListResponse<ResourcePoolRow>>("/v1/resources/pools?limit=200"),
  })
}

export function getResourceAllocationsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "allocations"],
    queryFn: () =>
      api.get<ListResponse<ResourceAllocationRow>>("/v1/resources/allocations?limit=200"),
  })
}

export function getResourceAssignmentsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "assignments"],
    queryFn: () =>
      api.get<ListResponse<ResourceSlotAssignmentRow>>("/v1/resources/slot-assignments?limit=200"),
  })
}

export function getResourceCloseoutsQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "closeouts"],
    queryFn: () => api.get<ListResponse<ResourceCloseoutRow>>("/v1/resources/closeouts?limit=200"),
  })
}
