import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLink } from "lucide-react"
import { Badge, Button } from "@/components/ui"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"

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

export type SupplierOption = { id: string; name: string }
export type ProductOption = { id: string; name: string }
export type BookingOption = { id: string; bookingNumber: string }

export type ChannelRow = {
  id: string
  name: string
  kind: "direct" | "affiliate" | "ota" | "reseller" | "marketplace" | "api_partner"
  status: "active" | "inactive" | "pending" | "archived"
  website: string | null
  contactName: string | null
  contactEmail: string | null
  metadata: Record<string, unknown> | null
}

export type ChannelContractRow = {
  id: string
  channelId: string
  supplierId: string | null
  status: "draft" | "active" | "expired" | "terminated"
  startsAt: string
  endsAt: string | null
  paymentOwner: "operator" | "channel" | "split"
  cancellationOwner: "operator" | "channel" | "mixed"
  settlementTerms: string | null
  notes: string | null
}

export type ChannelCommissionRuleRow = {
  id: string
  contractId: string
  scope: "booking" | "product" | "rate" | "category"
  productId: string | null
  externalRateId: string | null
  externalCategoryId: string | null
  commissionType: "fixed" | "percentage"
  amountCents: number | null
  percentBasisPoints: number | null
  validFrom: string | null
  validTo: string | null
}

export type ChannelProductMappingRow = {
  id: string
  channelId: string
  productId: string
  externalProductId: string
  externalRateId: string | null
  externalCategoryId: string | null
  active: boolean
}

export type ChannelBookingLinkRow = {
  id: string
  channelId: string
  bookingId: string
  externalBookingId: string | null
  externalReference: string | null
  externalStatus: string | null
  bookedAtExternal: string | null
  lastSyncedAt: string | null
}

export type ChannelWebhookEventRow = {
  id: string
  channelId: string
  eventType: string
  externalEventId: string | null
  payload: Record<string, unknown>
  receivedAt: string | null
  processedAt: string | null
  status: "pending" | "processed" | "failed" | "ignored"
  errorMessage: string | null
}

export const NONE_VALUE = "__none__"

export const channelKindOptions = [
  { value: "direct", label: "Direct" },
  { value: "affiliate", label: "Affiliate" },
  { value: "ota", label: "OTA" },
  { value: "reseller", label: "Reseller" },
  { value: "marketplace", label: "Marketplace" },
  { value: "api_partner", label: "API Partner" },
] as const

export const channelStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "archived", label: "Archived" },
] as const

export const contractStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
] as const

export const paymentOwnerOptions = [
  { value: "operator", label: "Operator" },
  { value: "channel", label: "Channel" },
  { value: "split", label: "Split" },
] as const

export const cancellationOwnerOptions = [
  { value: "operator", label: "Operator" },
  { value: "channel", label: "Channel" },
  { value: "mixed", label: "Mixed" },
] as const

export const commissionScopeOptions = [
  { value: "booking", label: "Booking" },
  { value: "product", label: "Product" },
  { value: "rate", label: "Rate" },
  { value: "category", label: "Category" },
] as const

export const commissionTypeOptions = [
  { value: "fixed", label: "Fixed" },
  { value: "percentage", label: "Percentage" },
] as const

export const webhookStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "processed", label: "Processed" },
  { value: "failed", label: "Failed" },
  { value: "ignored", label: "Ignored" },
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

export const channelColumns = (onView: (channelId: string) => void): ColumnDef<ChannelRow>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Channel" />,
  },
  {
    accessorKey: "kind",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kind" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.kind.replace("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "active" ? "default" : "secondary"}
        className="capitalize"
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "website",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Website" />,
    cell: ({ row }) => row.original.website ?? "-",
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

export const contractColumns = (
  channels: ChannelRow[],
  suppliers: SupplierOption[],
  onView: (contractId: string) => void,
): ColumnDef<ChannelContractRow>[] => [
  {
    accessorKey: "channelId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Channel" />,
    cell: ({ row }) => labelById(channels, row.original.channelId),
  },
  {
    accessorKey: "supplierId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
    cell: ({ row }) => labelById(suppliers, row.original.supplierId),
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
    accessorKey: "paymentOwner",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Payment" />,
  },
  {
    accessorKey: "startsAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start" />,
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

export const commissionColumns = (
  _contracts: ChannelContractRow[],
  products: ProductOption[],
  onView: (commissionRuleId: string) => void,
): ColumnDef<ChannelCommissionRuleRow>[] => [
  {
    accessorKey: "contractId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contract" />,
    cell: ({ row }) => row.original.contractId,
  },
  {
    accessorKey: "scope",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Scope" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.scope}
      </Badge>
    ),
  },
  {
    accessorKey: "productId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => labelById(products, row.original.productId),
  },
  {
    accessorKey: "commissionType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
  },
  {
    accessorKey: "amountCents",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => row.original.amountCents ?? "-",
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

export const mappingColumns = (
  channels: ChannelRow[],
  products: ProductOption[],
  onView: (mappingId: string) => void,
): ColumnDef<ChannelProductMappingRow>[] => [
  {
    accessorKey: "channelId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Channel" />,
    cell: ({ row }) => labelById(channels, row.original.channelId),
  },
  {
    accessorKey: "productId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => labelById(products, row.original.productId),
  },
  {
    accessorKey: "externalProductId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="External Product" />,
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

export const bookingLinkColumns = (
  channels: ChannelRow[],
  bookings: BookingOption[],
  onView: (bookingLinkId: string) => void,
): ColumnDef<ChannelBookingLinkRow>[] => [
  {
    accessorKey: "channelId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Channel" />,
    cell: ({ row }) => labelById(channels, row.original.channelId),
  },
  {
    accessorKey: "bookingId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
    cell: ({ row }) => labelById(bookings, row.original.bookingId),
  },
  {
    accessorKey: "externalBookingId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="External Booking" />,
    cell: ({ row }) => row.original.externalBookingId ?? "-",
  },
  {
    accessorKey: "externalStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="External Status" />,
    cell: ({ row }) => row.original.externalStatus ?? "-",
  },
  {
    accessorKey: "lastSyncedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Synced" />,
    cell: ({ row }) => formatDateTime(row.original.lastSyncedAt),
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

export const webhookColumns = (
  channels: ChannelRow[],
  onView: (webhookEventId: string) => void,
): ColumnDef<ChannelWebhookEventRow>[] => [
  {
    accessorKey: "channelId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Channel" />,
    cell: ({ row }) => labelById(channels, row.original.channelId),
  },
  {
    accessorKey: "eventType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Event Type" />,
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
    accessorKey: "receivedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Received" />,
    cell: ({ row }) => formatDateTime(row.original.receivedAt),
  },
  {
    accessorKey: "processedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Processed" />,
    cell: ({ row }) => formatDateTime(row.original.processedAt),
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
