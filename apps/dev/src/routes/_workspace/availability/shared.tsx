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

export type ProductOption = {
  id: string
  name: string
}

export type AvailabilityRuleRow = {
  id: string
  productId: string
  timezone: string
  recurrenceRule: string
  maxCapacity: number
  maxPickupCapacity: number | null
  cutoffMinutes: number | null
  active: boolean
}

export type AvailabilityStartTimeRow = {
  id: string
  productId: string
  label: string | null
  startTimeLocal: string
  durationMinutes: number | null
  sortOrder: number
  active: boolean
}

export type AvailabilitySlotRow = {
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

export type AvailabilityCloseoutRow = {
  id: string
  productId: string
  slotId: string | null
  dateLocal: string
  reason: string | null
  createdBy: string | null
}

export type AvailabilityPickupPointRow = {
  id: string
  productId: string
  name: string
  description: string | null
  locationText: string | null
  active: boolean
}

export const NONE_VALUE = "__none__"

const slotStatusVariant: Record<
  AvailabilitySlotRow["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  open: "default",
  closed: "secondary",
  sold_out: "destructive",
  cancelled: "outline",
}

export const booleanOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const

export const slotStatusOptions = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "sold_out", label: "Sold Out" },
  { value: "cancelled", label: "Cancelled" },
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

export function productNameById(products: ProductOption[], productId: string) {
  return products.find((product) => product.id === productId)?.name ?? productId
}

export function formatSelectionLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export const ruleColumns = (
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

export const startTimeColumns = (
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

export const slotColumns = (
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

export const closeoutColumns = (
  products: ProductOption[],
): ColumnDef<AvailabilityCloseoutRow>[] => [
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

export const pickupPointColumns = (
  products: ProductOption[],
): ColumnDef<AvailabilityPickupPointRow>[] => [
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

export function getAvailabilityProductsQueryOptions() {
  return queryOptions({
    queryKey: ["availability", "products"],
    queryFn: () => api.get<ListResponse<ProductOption>>("/v1/products?limit=100"),
  })
}

export function getAvailabilityRulesQueryOptions() {
  return queryOptions({
    queryKey: ["availability", "rules"],
    queryFn: () => api.get<ListResponse<AvailabilityRuleRow>>("/v1/availability/rules?limit=200"),
  })
}

export function getAvailabilityStartTimesQueryOptions() {
  return queryOptions({
    queryKey: ["availability", "start-times"],
    queryFn: () =>
      api.get<ListResponse<AvailabilityStartTimeRow>>("/v1/availability/start-times?limit=200"),
  })
}

export function getAvailabilitySlotsQueryOptions() {
  return queryOptions({
    queryKey: ["availability", "slots"],
    queryFn: () => api.get<ListResponse<AvailabilitySlotRow>>("/v1/availability/slots?limit=200"),
  })
}

export function getAvailabilityCloseoutsQueryOptions() {
  return queryOptions({
    queryKey: ["availability", "closeouts"],
    queryFn: () =>
      api.get<ListResponse<AvailabilityCloseoutRow>>("/v1/availability/closeouts?limit=200"),
  })
}

export function getAvailabilityPickupPointsQueryOptions() {
  return queryOptions({
    queryKey: ["availability", "pickup-points"],
    queryFn: () =>
      api.get<ListResponse<AvailabilityPickupPointRow>>("/v1/availability/pickup-points?limit=200"),
  })
}
