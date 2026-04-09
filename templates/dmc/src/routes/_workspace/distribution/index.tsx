import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { DollarSign, ExternalLink, Link2, Loader2, Plus, Search, Webhook } from "lucide-react"
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

type SupplierOption = { id: string; name: string }
type ProductOption = { id: string; name: string }
type BookingOption = { id: string; bookingNumber: string }

type ChannelRow = {
  id: string
  name: string
  kind: "direct" | "affiliate" | "ota" | "reseller" | "marketplace" | "api_partner"
  status: "active" | "inactive" | "pending" | "archived"
  website: string | null
  contactName: string | null
  contactEmail: string | null
  metadata: Record<string, unknown> | null
}

type ChannelContractRow = {
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

type ChannelCommissionRuleRow = {
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

type ChannelProductMappingRow = {
  id: string
  channelId: string
  productId: string
  externalProductId: string
  externalRateId: string | null
  externalCategoryId: string | null
  active: boolean
}

type ChannelBookingLinkRow = {
  id: string
  channelId: string
  bookingId: string
  externalBookingId: string | null
  externalReference: string | null
  externalStatus: string | null
  bookedAtExternal: string | null
  lastSyncedAt: string | null
}

type ChannelWebhookEventRow = {
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

const NONE_VALUE = "__none__"

const channelKindOptions = [
  { value: "direct", label: "Direct" },
  { value: "affiliate", label: "Affiliate" },
  { value: "ota", label: "OTA" },
  { value: "reseller", label: "Reseller" },
  { value: "marketplace", label: "Marketplace" },
  { value: "api_partner", label: "API Partner" },
] as const

const channelStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "archived", label: "Archived" },
] as const

const contractStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
] as const

const paymentOwnerOptions = [
  { value: "operator", label: "Operator" },
  { value: "channel", label: "Channel" },
  { value: "split", label: "Split" },
] as const

const cancellationOwnerOptions = [
  { value: "operator", label: "Operator" },
  { value: "channel", label: "Channel" },
  { value: "mixed", label: "Mixed" },
] as const

const commissionScopeOptions = [
  { value: "booking", label: "Booking" },
  { value: "product", label: "Product" },
  { value: "rate", label: "Rate" },
  { value: "category", label: "Category" },
] as const

const commissionTypeOptions = [
  { value: "fixed", label: "Fixed" },
  { value: "percentage", label: "Percentage" },
] as const

const webhookStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "processed", label: "Processed" },
  { value: "failed", label: "Failed" },
  { value: "ignored", label: "Ignored" },
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

function parseJsonRecord(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return null
  const parsed = JSON.parse(trimmed) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object")
  }
  return parsed as Record<string, unknown>
}

function formatSelectionLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

const channelColumns = (onView: (channelId: string) => void): ColumnDef<ChannelRow>[] => [
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

const contractColumns = (
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

const commissionColumns = (
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

const mappingColumns = (
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

const bookingLinkColumns = (
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

const webhookColumns = (
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

export const Route = createFileRoute("/_workspace/distribution/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getDistributionSuppliersQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionProductsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionBookingsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionChannelsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionContractsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionCommissionRulesQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionMappingsQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionBookingLinksQueryOptions()),
      context.queryClient.ensureQueryData(getDistributionWebhookEventsQueryOptions()),
    ]),
  component: DistributionPage,
})

function getDistributionSuppliersQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "suppliers"],
    queryFn: () => api.get<ListResponse<SupplierOption>>("/v1/suppliers?limit=200"),
  })
}

function getDistributionProductsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "products"],
    queryFn: () => api.get<ListResponse<ProductOption>>("/v1/products?limit=200"),
  })
}

function getDistributionBookingsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "bookings"],
    queryFn: () => api.get<ListResponse<BookingOption>>("/v1/bookings?limit=200"),
  })
}

function getDistributionChannelsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "channels"],
    queryFn: () => api.get<ListResponse<ChannelRow>>("/v1/distribution/channels?limit=200"),
  })
}

function getDistributionContractsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "contracts"],
    queryFn: () =>
      api.get<ListResponse<ChannelContractRow>>("/v1/distribution/contracts?limit=200"),
  })
}

function getDistributionCommissionRulesQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "commission-rules"],
    queryFn: () =>
      api.get<ListResponse<ChannelCommissionRuleRow>>(
        "/v1/distribution/commission-rules?limit=200",
      ),
  })
}

function getDistributionMappingsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "product-mappings"],
    queryFn: () =>
      api.get<ListResponse<ChannelProductMappingRow>>(
        "/v1/distribution/product-mappings?limit=200",
      ),
  })
}

function getDistributionBookingLinksQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "booking-links"],
    queryFn: () =>
      api.get<ListResponse<ChannelBookingLinkRow>>("/v1/distribution/booking-links?limit=200"),
  })
}

function getDistributionWebhookEventsQueryOptions() {
  return queryOptions({
    queryKey: ["distribution", "webhook-events"],
    queryFn: () =>
      api.get<ListResponse<ChannelWebhookEventRow>>("/v1/distribution/webhook-events?limit=200"),
  })
}

function DistributionPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [bulkActionTarget, setBulkActionTarget] = useState<string | null>(null)
  const [channelSelection, setChannelSelection] = useState<RowSelectionState>({})
  const [contractSelection, setContractSelection] = useState<RowSelectionState>({})
  const [commissionSelection, setCommissionSelection] = useState<RowSelectionState>({})
  const [mappingSelection, setMappingSelection] = useState<RowSelectionState>({})
  const [bookingLinkSelection, setBookingLinkSelection] = useState<RowSelectionState>({})
  const [webhookSelection, setWebhookSelection] = useState<RowSelectionState>({})
  const [channelDialogOpen, setChannelDialogOpen] = useState(false)
  const [contractDialogOpen, setContractDialogOpen] = useState(false)
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false)
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [bookingLinkDialogOpen, setBookingLinkDialogOpen] = useState(false)
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<ChannelRow | undefined>()
  const [editingContract, setEditingContract] = useState<ChannelContractRow | undefined>()
  const [editingCommission, setEditingCommission] = useState<ChannelCommissionRuleRow | undefined>()
  const [editingMapping, setEditingMapping] = useState<ChannelProductMappingRow | undefined>()
  const [editingBookingLink, setEditingBookingLink] = useState<ChannelBookingLinkRow | undefined>()
  const [editingWebhook, setEditingWebhook] = useState<ChannelWebhookEventRow | undefined>()

  const suppliersQuery = useQuery(getDistributionSuppliersQueryOptions())
  const productsQuery = useQuery(getDistributionProductsQueryOptions())
  const bookingsQuery = useQuery(getDistributionBookingsQueryOptions())
  const channelsQuery = useQuery(getDistributionChannelsQueryOptions())
  const contractsQuery = useQuery(getDistributionContractsQueryOptions())
  const commissionRulesQuery = useQuery(getDistributionCommissionRulesQueryOptions())
  const mappingsQuery = useQuery(getDistributionMappingsQueryOptions())
  const bookingLinksQuery = useQuery(getDistributionBookingLinksQueryOptions())
  const webhookEventsQuery = useQuery(getDistributionWebhookEventsQueryOptions())

  const suppliers = suppliersQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const bookings = bookingsQuery.data?.data ?? []
  const channels = channelsQuery.data?.data ?? []
  const contracts = contractsQuery.data?.data ?? []
  const commissionRules = commissionRulesQuery.data?.data ?? []
  const mappings = mappingsQuery.data?.data ?? []
  const bookingLinks = bookingLinksQuery.data?.data ?? []
  const webhookEvents = webhookEventsQuery.data?.data ?? []
  const contractsById = new Map(contracts.map((contract) => [contract.id, contract]))
  const normalizedSearch = search.trim().toLowerCase()
  const matchesSearch = (...values: Array<string | number | null | undefined>) =>
    !normalizedSearch ||
    values.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  const matchesChannel = (id: string | null | undefined) =>
    channelFilter === "all" || id === channelFilter

  const filteredChannels = channels.filter(
    (channel) =>
      matchesChannel(channel.id) &&
      matchesSearch(
        channel.name,
        channel.kind,
        channel.status,
        channel.website,
        channel.contactName,
        channel.contactEmail,
      ),
  )
  const filteredContracts = contracts.filter(
    (contract) =>
      matchesChannel(contract.channelId) &&
      matchesSearch(
        labelById(channels, contract.channelId),
        labelById(suppliers, contract.supplierId),
        contract.status,
        contract.paymentOwner,
        contract.startsAt,
        contract.endsAt,
        contract.settlementTerms,
        contract.notes,
      ),
  )
  const filteredCommissionRules = commissionRules.filter((rule) => {
    const contract = contractsById.get(rule.contractId)
    return (
      matchesChannel(contract?.channelId) &&
      matchesSearch(
        rule.contractId,
        labelById(products, rule.productId),
        rule.scope,
        rule.commissionType,
        rule.amountCents,
        rule.percentBasisPoints,
        rule.externalRateId,
        rule.externalCategoryId,
      )
    )
  })
  const filteredMappings = mappings.filter(
    (mapping) =>
      matchesChannel(mapping.channelId) &&
      matchesSearch(
        labelById(channels, mapping.channelId),
        labelById(products, mapping.productId),
        mapping.externalProductId,
        mapping.externalRateId,
        mapping.externalCategoryId,
      ),
  )
  const filteredBookingLinks = bookingLinks.filter(
    (bookingLink) =>
      matchesChannel(bookingLink.channelId) &&
      matchesSearch(
        labelById(channels, bookingLink.channelId),
        labelById(bookings, bookingLink.bookingId),
        bookingLink.externalBookingId,
        bookingLink.externalReference,
        bookingLink.externalStatus,
      ),
  )
  const filteredWebhookEvents = webhookEvents.filter(
    (event) =>
      matchesChannel(event.channelId) &&
      matchesSearch(
        labelById(channels, event.channelId),
        event.eventType,
        event.externalEventId,
        event.status,
        event.errorMessage,
      ),
  )
  const activeChannelsCount = filteredChannels.filter(
    (channel) => channel.status === "active",
  ).length
  const activeContractsCount = filteredContracts.filter(
    (contract) => contract.status === "active",
  ).length
  const activeMappingsCount = filteredMappings.filter((mapping) => mapping.active).length
  const syncQueue = [...filteredWebhookEvents].filter(
    (event) => event.status === "pending" || event.status === "failed",
  )
  const contractsNeedingReview = filteredContracts.filter(
    (contract) => contract.status !== "active",
  )
  const hasFilters = search.length > 0 || channelFilter !== "all"

  const isLoading =
    suppliersQuery.isPending ||
    productsQuery.isPending ||
    bookingsQuery.isPending ||
    channelsQuery.isPending ||
    contractsQuery.isPending ||
    commissionRulesQuery.isPending ||
    mappingsQuery.isPending ||
    bookingLinksQuery.isPending ||
    webhookEventsQuery.isPending

  const refreshAll = async () => {
    await Promise.all([
      channelsQuery.refetch(),
      contractsQuery.refetch(),
      commissionRulesQuery.refetch(),
      mappingsQuery.refetch(),
      bookingLinksQuery.refetch(),
      webhookEventsQuery.refetch(),
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
        <h1 className="text-2xl font-bold tracking-tight">Distribution</h1>
        <p className="text-sm text-muted-foreground">
          Manage sales channels, commercial contracts, external mappings, and sync events.
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
              title="Active Channels"
              value={activeChannelsCount}
              description="Live sales and reseller endpoints"
              icon={Link2}
            />
            <OverviewMetric
              title="Active Contracts"
              value={activeContractsCount}
              description="Commercial agreements currently in force"
              icon={DollarSign}
            />
            <OverviewMetric
              title="Active Mappings"
              value={activeMappingsCount}
              description="Products exposed to external channels"
              icon={ExternalLink}
            />
            <OverviewMetric
              title="Sync Queue"
              value={syncQueue.length}
              description="Pending or failed inbound events"
              icon={Webhook}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Webhook Queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {syncQueue.length === 0 ? (
                  <p className="text-muted-foreground">No pending or failed events in the queue.</p>
                ) : (
                  syncQueue.slice(0, 4).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className="block w-full rounded-md border p-3 text-left hover:bg-muted/40"
                      onClick={() =>
                        void navigate({
                          to: "/distribution/webhook-events/$id",
                          params: { id: event.id },
                        })
                      }
                    >
                      <div className="font-medium">
                        {labelById(channels, event.channelId)} · {event.eventType}
                      </div>
                      <div className="text-muted-foreground capitalize">
                        {event.status} · Received {formatDateTime(event.receivedAt)}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Contracts To Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {contractsNeedingReview.length === 0 ? (
                  <p className="text-muted-foreground">All contracts are currently active.</p>
                ) : (
                  contractsNeedingReview.slice(0, 4).map((contract) => (
                    <button
                      key={contract.id}
                      type="button"
                      className="block w-full rounded-md border p-3 text-left hover:bg-muted/40"
                      onClick={() =>
                        void navigate({
                          to: "/distribution/contracts/$id",
                          params: { id: contract.id },
                        })
                      }
                    >
                      <div className="font-medium">
                        {labelById(channels, contract.channelId)} · {contract.startsAt}
                      </div>
                      <div className="text-muted-foreground capitalize">
                        {contract.status} · Supplier {labelById(suppliers, contract.supplierId)}
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
                  placeholder="Search distribution..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={channelFilter}
                onValueChange={(value) => setChannelFilter(value ?? "all")}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
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
                  setChannelFilter("all")
                }}
              >
                Clear Filters
              </Button>
            ) : null}
          </div>

          <Tabs defaultValue="channels">
            <TabsList variant="line">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="commissions">Commission Rules</TabsTrigger>
              <TabsTrigger value="mappings">Product Mappings</TabsTrigger>
              <TabsTrigger value="booking-links">Booking Links</TabsTrigger>
              <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="space-y-4">
              <SectionHeader
                title="Channels"
                description="Sales partners, affiliates, OTAs, marketplaces, and direct channels."
                actionLabel="New Channel"
                onAction={() => {
                  setEditingChannel(undefined)
                  setChannelDialogOpen(true)
                }}
              />
              <DataTable
                columns={channelColumns((channelId) => {
                  void navigate({ to: "/distribution/$id", params: { id: channelId } })
                })}
                data={filteredChannels}
                emptyMessage="No channels match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={channelSelection}
                onRowSelectionChange={setChannelSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Activate"
                      confirmLabel="Activate Channels"
                      title={`Activate ${formatSelectionLabel(selectedRows.length, "channel")}?`}
                      description="This enables the selected channels for live distribution again."
                      disabled={bulkActionTarget === "channels-activate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/channels",
                          target: "channels-activate",
                          noun: "channel",
                          payload: { status: "active" },
                          successVerb: "Activated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Archive"
                      confirmLabel="Archive Channels"
                      title={`Archive ${formatSelectionLabel(selectedRows.length, "channel")}?`}
                      description="This keeps the selected channels for history but removes them from active commercial use."
                      disabled={bulkActionTarget === "channels-archive"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/channels",
                          target: "channels-archive",
                          noun: "channel",
                          payload: { status: "archived" },
                          successVerb: "Archived",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Channels"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "channel")}?`}
                      description="This permanently removes the selected channels. Use Archive if you only need to retire them from active use."
                      disabled={bulkActionTarget === "channels-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/channels",
                          target: "channels-delete",
                          noun: "channel",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingChannel(row.original)
                  setChannelDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              <SectionHeader
                title="Contracts"
                description="Commercial terms per channel and supplier relationship."
                actionLabel="New Contract"
                onAction={() => {
                  setEditingContract(undefined)
                  setContractDialogOpen(true)
                }}
              />
              <DataTable
                columns={contractColumns(channels, suppliers, (contractId) => {
                  void navigate({ to: "/distribution/contracts/$id", params: { id: contractId } })
                })}
                data={filteredContracts}
                emptyMessage="No contracts match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={contractSelection}
                onRowSelectionChange={setContractSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Activate"
                      confirmLabel="Activate Contracts"
                      title={`Activate ${formatSelectionLabel(selectedRows.length, "contract")}?`}
                      description="This marks the selected contracts as commercially active."
                      disabled={bulkActionTarget === "contracts-activate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/contracts",
                          target: "contracts-activate",
                          noun: "contract",
                          payload: { status: "active" },
                          successVerb: "Activated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Expire"
                      confirmLabel="Expire Contracts"
                      title={`Expire ${formatSelectionLabel(selectedRows.length, "contract")}?`}
                      description="This preserves the selected contracts but marks them as no longer in force."
                      disabled={bulkActionTarget === "contracts-expire"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/contracts",
                          target: "contracts-expire",
                          noun: "contract",
                          payload: { status: "expired" },
                          successVerb: "Expired",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Contracts"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "contract")}?`}
                      description="This permanently removes the selected contracts and their commercial setup."
                      disabled={bulkActionTarget === "contracts-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/contracts",
                          target: "contracts-delete",
                          noun: "contract",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingContract(row.original)
                  setContractDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="commissions" className="space-y-4">
              <SectionHeader
                title="Commission Rules"
                description="Define booking, product, rate, and category-based commission logic."
                actionLabel="New Commission Rule"
                onAction={() => {
                  setEditingCommission(undefined)
                  setCommissionDialogOpen(true)
                }}
              />
              <DataTable
                columns={commissionColumns(contracts, products, (commissionRuleId) => {
                  void navigate({
                    to: "/distribution/commission-rules/$id",
                    params: { id: commissionRuleId },
                  })
                })}
                data={filteredCommissionRules}
                emptyMessage="No commission rules match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={commissionSelection}
                onRowSelectionChange={setCommissionSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Commission Rules"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "commission rule")}?`}
                      description="This permanently removes the selected commission rules from channel pricing."
                      disabled={bulkActionTarget === "commission-rules-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/commission-rules",
                          target: "commission-rules-delete",
                          noun: "commission rule",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingCommission(row.original)
                  setCommissionDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="mappings" className="space-y-4">
              <SectionHeader
                title="Product Mappings"
                description="Map Voyant products to external channel catalog identifiers."
                actionLabel="New Mapping"
                onAction={() => {
                  setEditingMapping(undefined)
                  setMappingDialogOpen(true)
                }}
              />
              <DataTable
                columns={mappingColumns(channels, products, (mappingId) => {
                  void navigate({ to: "/distribution/mappings/$id", params: { id: mappingId } })
                })}
                data={filteredMappings}
                emptyMessage="No product mappings match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={mappingSelection}
                onRowSelectionChange={setMappingSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Activate"
                      confirmLabel="Activate Mappings"
                      title={`Activate ${formatSelectionLabel(selectedRows.length, "mapping")}?`}
                      description="This re-enables the selected external product mappings for live channel use."
                      disabled={bulkActionTarget === "mappings-activate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/product-mappings",
                          target: "mappings-activate",
                          noun: "mapping",
                          payload: { active: true },
                          successVerb: "Activated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Deactivate"
                      confirmLabel="Deactivate Mappings"
                      title={`Deactivate ${formatSelectionLabel(selectedRows.length, "mapping")}?`}
                      description="This keeps the selected mappings for reference but removes them from active sync/distribution."
                      disabled={bulkActionTarget === "mappings-deactivate"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/product-mappings",
                          target: "mappings-deactivate",
                          noun: "mapping",
                          payload: { active: false },
                          successVerb: "Deactivated",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Mappings"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "mapping")}?`}
                      description="This permanently removes the selected external product mappings."
                      disabled={bulkActionTarget === "mappings-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/product-mappings",
                          target: "mappings-delete",
                          noun: "mapping",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingMapping(row.original)
                  setMappingDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="booking-links" className="space-y-4">
              <SectionHeader
                title="Booking Links"
                description="Track external booking IDs and sync state for channel-originated bookings."
                actionLabel="New Booking Link"
                onAction={() => {
                  setEditingBookingLink(undefined)
                  setBookingLinkDialogOpen(true)
                }}
              />
              <DataTable
                columns={bookingLinkColumns(channels, bookings, (bookingLinkId) => {
                  void navigate({
                    to: "/distribution/booking-links/$id",
                    params: { id: bookingLinkId },
                  })
                })}
                data={filteredBookingLinks}
                emptyMessage="No booking links match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={bookingLinkSelection}
                onRowSelectionChange={setBookingLinkSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Booking Links"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "booking link")}?`}
                      description="This permanently removes the selected external booking references and sync links."
                      disabled={bulkActionTarget === "booking-links-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/booking-links",
                          target: "booking-links-delete",
                          noun: "booking link",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingBookingLink(row.original)
                  setBookingLinkDialogOpen(true)
                }}
              />
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4">
              <SectionHeader
                title="Webhook Events"
                description="Inspect ingested partner events and replay/problem cases."
                actionLabel="New Webhook Event"
                onAction={() => {
                  setEditingWebhook(undefined)
                  setWebhookDialogOpen(true)
                }}
              />
              <DataTable
                columns={webhookColumns(channels, (webhookEventId) => {
                  void navigate({
                    to: "/distribution/webhook-events/$id",
                    params: { id: webhookEventId },
                  })
                })}
                data={filteredWebhookEvents}
                emptyMessage="No webhook events match the current filters."
                enableRowSelection
                getRowId={(row) => row.id}
                rowSelection={webhookSelection}
                onRowSelectionChange={setWebhookSelection}
                renderSelectionActions={({ selectedRows, clearSelection }) => (
                  <SelectionActionBar selectedCount={selectedRows.length} onClear={clearSelection}>
                    <ConfirmActionButton
                      buttonLabel="Mark Processed"
                      confirmLabel="Mark Processed"
                      title={`Mark ${formatSelectionLabel(selectedRows.length, "webhook event")} as processed?`}
                      description="This marks the selected events as processed and removes them from the active sync queue."
                      disabled={bulkActionTarget === "webhook-events-processed"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/webhook-events",
                          target: "webhook-events-processed",
                          noun: "webhook event",
                          payload: { status: "processed" },
                          successVerb: "Processed",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Ignore"
                      confirmLabel="Ignore Events"
                      title={`Ignore ${formatSelectionLabel(selectedRows.length, "webhook event")}?`}
                      description="This keeps the selected events in history but marks them as intentionally ignored."
                      disabled={bulkActionTarget === "webhook-events-ignored"}
                      onConfirm={() =>
                        handleBulkUpdate({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/webhook-events",
                          target: "webhook-events-ignored",
                          noun: "webhook event",
                          payload: { status: "ignored" },
                          successVerb: "Ignored",
                          clearSelection,
                        })
                      }
                    />
                    <ConfirmActionButton
                      buttonLabel="Delete Selected"
                      confirmLabel="Delete Events"
                      title={`Delete ${formatSelectionLabel(selectedRows.length, "webhook event")}?`}
                      description="This permanently removes the selected webhook events from the event log."
                      disabled={bulkActionTarget === "webhook-events-delete"}
                      variant="destructive"
                      confirmVariant="destructive"
                      onConfirm={() =>
                        handleBulkDelete({
                          ids: selectedRows.map((row) => row.original.id),
                          endpoint: "/v1/distribution/webhook-events",
                          target: "webhook-events-delete",
                          noun: "webhook event",
                          clearSelection,
                        })
                      }
                    />
                  </SelectionActionBar>
                )}
                onRowClick={(row) => {
                  setEditingWebhook(row.original)
                  setWebhookDialogOpen(true)
                }}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <ChannelDialog
        open={channelDialogOpen}
        onOpenChange={setChannelDialogOpen}
        channel={editingChannel}
        onSuccess={() => {
          setChannelDialogOpen(false)
          setEditingChannel(undefined)
          void refreshAll()
        }}
      />
      <ChannelContractDialog
        open={contractDialogOpen}
        onOpenChange={setContractDialogOpen}
        contract={editingContract}
        channels={channels}
        suppliers={suppliers}
        onSuccess={() => {
          setContractDialogOpen(false)
          setEditingContract(undefined)
          void refreshAll()
        }}
      />
      <ChannelCommissionRuleDialog
        open={commissionDialogOpen}
        onOpenChange={setCommissionDialogOpen}
        commissionRule={editingCommission}
        contracts={contracts}
        products={products}
        onSuccess={() => {
          setCommissionDialogOpen(false)
          setEditingCommission(undefined)
          void refreshAll()
        }}
      />
      <ChannelProductMappingDialog
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        mapping={editingMapping}
        channels={channels}
        products={products}
        onSuccess={() => {
          setMappingDialogOpen(false)
          setEditingMapping(undefined)
          void refreshAll()
        }}
      />
      <ChannelBookingLinkDialog
        open={bookingLinkDialogOpen}
        onOpenChange={setBookingLinkDialogOpen}
        bookingLink={editingBookingLink}
        channels={channels}
        bookings={bookings}
        onSuccess={() => {
          setBookingLinkDialogOpen(false)
          setEditingBookingLink(undefined)
          void refreshAll()
        }}
      />
      <ChannelWebhookEventDialog
        open={webhookDialogOpen}
        onOpenChange={setWebhookDialogOpen}
        webhookEvent={editingWebhook}
        channels={channels}
        onSuccess={() => {
          setWebhookDialogOpen(false)
          setEditingWebhook(undefined)
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

const channelFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  kind: z.enum(["direct", "affiliate", "ota", "reseller", "marketplace", "api_partner"]),
  status: z.enum(["active", "inactive", "pending", "archived"]),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  metadataJson: z.string().optional(),
})

function ChannelDialog({
  open,
  onOpenChange,
  channel,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  channel?: ChannelRow
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: "",
      kind: "direct" as const,
      status: "active" as const,
      website: "",
      contactName: "",
      contactEmail: "",
      metadataJson: "",
    },
  })

  useEffect(() => {
    if (open && channel) {
      form.reset({
        name: channel.name,
        kind: channel.kind,
        status: channel.status,
        website: channel.website ?? "",
        contactName: channel.contactName ?? "",
        contactEmail: channel.contactEmail ?? "",
        metadataJson: channel.metadata ? JSON.stringify(channel.metadata, null, 2) : "",
      })
    } else if (open) {
      form.reset()
    }
  }, [channel, form, open])

  const isEditing = Boolean(channel)

  const onSubmit = async (values: z.output<typeof channelFormSchema>) => {
    const payload = {
      name: values.name,
      kind: values.kind,
      status: values.status,
      website: nullableString(values.website),
      contactName: nullableString(values.contactName),
      contactEmail: nullableString(values.contactEmail),
      metadata: parseJsonRecord(values.metadataJson),
    }

    if (isEditing) {
      await api.patch(`/v1/distribution/channels/${channel?.id}`, payload)
    } else {
      await api.post("/v1/distribution/channels", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Channel" : "New Channel"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="GetYourGuide" />
              </div>
              <div className="grid gap-2">
                <Label>Kind</Label>
                <Select
                  value={form.watch("kind")}
                  onValueChange={(value) => form.setValue("kind", value as ChannelRow["kind"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channelKindOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as ChannelRow["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channelStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Website</Label>
                <Input {...form.register("website")} placeholder="https://partner.example.com" />
              </div>
              <div className="grid gap-2">
                <Label>Contact Name</Label>
                <Input {...form.register("contactName")} placeholder="Partnerships Team" />
              </div>
              <div className="grid gap-2">
                <Label>Contact Email</Label>
                <Input
                  {...form.register("contactEmail")}
                  type="email"
                  placeholder="partners@example.com"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Metadata JSON</Label>
              <Textarea
                {...form.register("metadataJson")}
                placeholder='{"region":"EU","accountTier":"gold"}'
                className="min-h-32 font-mono text-xs"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Channel" : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const contractFormSchema = z.object({
  channelId: z.string().min(1, "Channel is required"),
  supplierId: z.string().optional(),
  status: z.enum(["draft", "active", "expired", "terminated"]),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().optional(),
  paymentOwner: z.enum(["operator", "channel", "split"]),
  cancellationOwner: z.enum(["operator", "channel", "mixed"]),
  settlementTerms: z.string().optional(),
  notes: z.string().optional(),
})

function ChannelContractDialog({
  open,
  onOpenChange,
  contract,
  channels,
  suppliers,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract?: ChannelContractRow
  channels: ChannelRow[]
  suppliers: SupplierOption[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      channelId: "",
      supplierId: NONE_VALUE,
      status: "draft" as const,
      startsAt: "",
      endsAt: "",
      paymentOwner: "operator" as const,
      cancellationOwner: "operator" as const,
      settlementTerms: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && contract) {
      form.reset({
        channelId: contract.channelId,
        supplierId: contract.supplierId ?? NONE_VALUE,
        status: contract.status,
        startsAt: contract.startsAt,
        endsAt: contract.endsAt ?? "",
        paymentOwner: contract.paymentOwner,
        cancellationOwner: contract.cancellationOwner,
        settlementTerms: contract.settlementTerms ?? "",
        notes: contract.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [contract, form, open])

  const isEditing = Boolean(contract)

  const onSubmit = async (values: z.output<typeof contractFormSchema>) => {
    const payload = {
      channelId: values.channelId,
      supplierId: values.supplierId === NONE_VALUE ? null : values.supplierId,
      status: values.status,
      startsAt: values.startsAt,
      endsAt: nullableString(values.endsAt),
      paymentOwner: values.paymentOwner,
      cancellationOwner: values.cancellationOwner,
      settlementTerms: nullableString(values.settlementTerms),
      notes: nullableString(values.notes),
    }

    if (isEditing) {
      await api.patch(`/v1/distribution/contracts/${contract?.id}`, payload)
    } else {
      await api.post("/v1/distribution/contracts", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contract" : "New Contract"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Channel</Label>
                <Select
                  value={form.watch("channelId")}
                  onValueChange={(value) => form.setValue("channelId", value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) =>
                    form.setValue("status", value as ChannelContractRow["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Starts At</Label>
                <Input {...form.register("startsAt")} type="date" />
              </div>
              <div className="grid gap-2">
                <Label>Ends At</Label>
                <Input {...form.register("endsAt")} type="date" />
              </div>
              <div className="grid gap-2">
                <Label>Payment Owner</Label>
                <Select
                  value={form.watch("paymentOwner")}
                  onValueChange={(value) =>
                    form.setValue("paymentOwner", value as ChannelContractRow["paymentOwner"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOwnerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cancellation Owner</Label>
                <Select
                  value={form.watch("cancellationOwner")}
                  onValueChange={(value) =>
                    form.setValue(
                      "cancellationOwner",
                      value as ChannelContractRow["cancellationOwner"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cancellationOwnerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Settlement Terms</Label>
              <Textarea
                {...form.register("settlementTerms")}
                placeholder="Monthly payout, 45-day remittance, chargeback treatment..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Special commercial constraints or operational clauses..."
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Contract" : "Create Contract"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const commissionFormSchema = z.object({
  contractId: z.string().min(1, "Contract is required"),
  scope: z.enum(["booking", "product", "rate", "category"]),
  productId: z.string().optional(),
  externalRateId: z.string().optional(),
  externalCategoryId: z.string().optional(),
  commissionType: z.enum(["fixed", "percentage"]),
  amountCents: z.string().optional(),
  percentBasisPoints: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
})

function ChannelCommissionRuleDialog({
  open,
  onOpenChange,
  commissionRule,
  contracts,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  commissionRule?: ChannelCommissionRuleRow
  contracts: ChannelContractRow[]
  products: ProductOption[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      contractId: "",
      scope: "booking" as const,
      productId: NONE_VALUE,
      externalRateId: "",
      externalCategoryId: "",
      commissionType: "percentage" as const,
      amountCents: "",
      percentBasisPoints: "",
      validFrom: "",
      validTo: "",
    },
  })

  useEffect(() => {
    if (open && commissionRule) {
      form.reset({
        contractId: commissionRule.contractId,
        scope: commissionRule.scope,
        productId: commissionRule.productId ?? NONE_VALUE,
        externalRateId: commissionRule.externalRateId ?? "",
        externalCategoryId: commissionRule.externalCategoryId ?? "",
        commissionType: commissionRule.commissionType,
        amountCents: commissionRule.amountCents?.toString() ?? "",
        percentBasisPoints: commissionRule.percentBasisPoints?.toString() ?? "",
        validFrom: commissionRule.validFrom ?? "",
        validTo: commissionRule.validTo ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [commissionRule, form, open])

  const isEditing = Boolean(commissionRule)

  const onSubmit = async (values: z.output<typeof commissionFormSchema>) => {
    const payload = {
      contractId: values.contractId,
      scope: values.scope,
      productId: values.productId === NONE_VALUE ? null : values.productId,
      externalRateId: nullableString(values.externalRateId),
      externalCategoryId: nullableString(values.externalCategoryId),
      commissionType: values.commissionType,
      amountCents: nullableNumber(values.amountCents),
      percentBasisPoints: nullableNumber(values.percentBasisPoints),
      validFrom: nullableString(values.validFrom),
      validTo: nullableString(values.validTo),
    }

    if (isEditing) {
      await api.patch(`/v1/distribution/commission-rules/${commissionRule?.id}`, payload)
    } else {
      await api.post("/v1/distribution/commission-rules", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Commission Rule" : "New Commission Rule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contract</Label>
                <Select
                  value={form.watch("contractId")}
                  onValueChange={(value) => form.setValue("contractId", value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Scope</Label>
                <Select
                  value={form.watch("scope")}
                  onValueChange={(value) =>
                    form.setValue("scope", value as ChannelCommissionRuleRow["scope"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commissionScopeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <div className="grid gap-2">
                <Label>Commission Type</Label>
                <Select
                  value={form.watch("commissionType")}
                  onValueChange={(value) =>
                    form.setValue(
                      "commissionType",
                      value as ChannelCommissionRuleRow["commissionType"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commissionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Amount Cents</Label>
                <Input {...form.register("amountCents")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>Percent Basis Points</Label>
                <Input {...form.register("percentBasisPoints")} type="number" min={0} />
              </div>
              <div className="grid gap-2">
                <Label>External Rate ID</Label>
                <Input {...form.register("externalRateId")} placeholder="RACK-STD" />
              </div>
              <div className="grid gap-2">
                <Label>External Category ID</Label>
                <Input {...form.register("externalCategoryId")} placeholder="adult" />
              </div>
              <div className="grid gap-2">
                <Label>Valid From</Label>
                <Input {...form.register("validFrom")} type="date" />
              </div>
              <div className="grid gap-2">
                <Label>Valid To</Label>
                <Input {...form.register("validTo")} type="date" />
              </div>
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

const mappingFormSchema = z.object({
  channelId: z.string().min(1, "Channel is required"),
  productId: z.string().min(1, "Product is required"),
  externalProductId: z.string().min(1, "External product ID is required"),
  externalRateId: z.string().optional(),
  externalCategoryId: z.string().optional(),
  active: z.boolean(),
})

function ChannelProductMappingDialog({
  open,
  onOpenChange,
  mapping,
  channels,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mapping?: ChannelProductMappingRow
  channels: ChannelRow[]
  products: ProductOption[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      channelId: "",
      productId: "",
      externalProductId: "",
      externalRateId: "",
      externalCategoryId: "",
      active: true,
    },
  })

  useEffect(() => {
    if (open && mapping) {
      form.reset({
        channelId: mapping.channelId,
        productId: mapping.productId,
        externalProductId: mapping.externalProductId,
        externalRateId: mapping.externalRateId ?? "",
        externalCategoryId: mapping.externalCategoryId ?? "",
        active: mapping.active,
      })
    } else if (open) {
      form.reset()
    }
  }, [form, mapping, open])

  const isEditing = Boolean(mapping)

  const onSubmit = async (values: z.output<typeof mappingFormSchema>) => {
    const payload = {
      channelId: values.channelId,
      productId: values.productId,
      externalProductId: values.externalProductId,
      externalRateId: nullableString(values.externalRateId),
      externalCategoryId: nullableString(values.externalCategoryId),
      active: values.active,
    }

    if (isEditing) {
      await api.patch(`/v1/distribution/product-mappings/${mapping?.id}`, payload)
    } else {
      await api.post("/v1/distribution/product-mappings", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product Mapping" : "New Product Mapping"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Channel</Label>
              <Select
                value={form.watch("channelId")}
                onValueChange={(value) => form.setValue("channelId", value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
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
                <Label>External Product ID</Label>
                <Input {...form.register("externalProductId")} placeholder="fh_12345" />
              </div>
              <div className="grid gap-2">
                <Label>External Rate ID</Label>
                <Input {...form.register("externalRateId")} placeholder="adult" />
              </div>
              <div className="grid gap-2">
                <Label>External Category ID</Label>
                <Input {...form.register("externalCategoryId")} placeholder="high-season" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Include this mapping in outbound sync and reconciliation.
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
              {isEditing ? "Save Mapping" : "Create Mapping"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const bookingLinkFormSchema = z.object({
  channelId: z.string().min(1, "Channel is required"),
  bookingId: z.string().min(1, "Booking is required"),
  externalBookingId: z.string().optional(),
  externalReference: z.string().optional(),
  externalStatus: z.string().optional(),
  bookedAtExternal: z.string().optional(),
  lastSyncedAt: z.string().optional(),
})

function ChannelBookingLinkDialog({
  open,
  onOpenChange,
  bookingLink,
  channels,
  bookings,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingLink?: ChannelBookingLinkRow
  channels: ChannelRow[]
  bookings: BookingOption[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(bookingLinkFormSchema),
    defaultValues: {
      channelId: "",
      bookingId: "",
      externalBookingId: "",
      externalReference: "",
      externalStatus: "",
      bookedAtExternal: "",
      lastSyncedAt: "",
    },
  })

  useEffect(() => {
    if (open && bookingLink) {
      form.reset({
        channelId: bookingLink.channelId,
        bookingId: bookingLink.bookingId,
        externalBookingId: bookingLink.externalBookingId ?? "",
        externalReference: bookingLink.externalReference ?? "",
        externalStatus: bookingLink.externalStatus ?? "",
        bookedAtExternal: toLocalDateTimeInput(bookingLink.bookedAtExternal),
        lastSyncedAt: toLocalDateTimeInput(bookingLink.lastSyncedAt),
      })
    } else if (open) {
      form.reset()
    }
  }, [bookingLink, form, open])

  const isEditing = Boolean(bookingLink)

  const onSubmit = async (values: z.output<typeof bookingLinkFormSchema>) => {
    const payload = {
      channelId: values.channelId,
      bookingId: values.bookingId,
      externalBookingId: nullableString(values.externalBookingId),
      externalReference: nullableString(values.externalReference),
      externalStatus: nullableString(values.externalStatus),
      bookedAtExternal: toIsoDateTime(values.bookedAtExternal),
      lastSyncedAt: toIsoDateTime(values.lastSyncedAt),
    }

    if (isEditing) {
      await api.patch(`/v1/distribution/booking-links/${bookingLink?.id}`, payload)
    } else {
      await api.post("/v1/distribution/booking-links", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Booking Link" : "New Booking Link"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Channel</Label>
              <Select
                value={form.watch("channelId")}
                onValueChange={(value) => form.setValue("channelId", value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Booking</Label>
              <Select
                value={form.watch("bookingId")}
                onValueChange={(value) => form.setValue("bookingId", value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select booking" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.bookingNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>External Booking ID</Label>
                <Input {...form.register("externalBookingId")} placeholder="123456" />
              </div>
              <div className="grid gap-2">
                <Label>External Reference</Label>
                <Input {...form.register("externalReference")} placeholder="OTA-REF-002" />
              </div>
              <div className="grid gap-2">
                <Label>External Status</Label>
                <Input {...form.register("externalStatus")} placeholder="confirmed" />
              </div>
              <div className="grid gap-2">
                <Label>Booked At External</Label>
                <Input {...form.register("bookedAtExternal")} type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label>Last Synced At</Label>
                <Input {...form.register("lastSyncedAt")} type="datetime-local" />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Booking Link" : "Create Booking Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const webhookFormSchema = z.object({
  channelId: z.string().min(1, "Channel is required"),
  eventType: z.string().min(1, "Event type is required"),
  externalEventId: z.string().optional(),
  payloadJson: z.string().min(2, "Payload JSON is required"),
  receivedAt: z.string().optional(),
  processedAt: z.string().optional(),
  status: z.enum(["pending", "processed", "failed", "ignored"]),
  errorMessage: z.string().optional(),
})

function ChannelWebhookEventDialog({
  open,
  onOpenChange,
  webhookEvent,
  channels,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  webhookEvent?: ChannelWebhookEventRow
  channels: ChannelRow[]
  onSuccess: () => void
}) {
  const form = useForm({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      channelId: "",
      eventType: "",
      externalEventId: "",
      payloadJson: "{}",
      receivedAt: "",
      processedAt: "",
      status: "pending" as const,
      errorMessage: "",
    },
  })

  useEffect(() => {
    if (open && webhookEvent) {
      form.reset({
        channelId: webhookEvent.channelId,
        eventType: webhookEvent.eventType,
        externalEventId: webhookEvent.externalEventId ?? "",
        payloadJson: JSON.stringify(webhookEvent.payload, null, 2),
        receivedAt: toLocalDateTimeInput(webhookEvent.receivedAt),
        processedAt: toLocalDateTimeInput(webhookEvent.processedAt),
        status: webhookEvent.status,
        errorMessage: webhookEvent.errorMessage ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [form, open, webhookEvent])

  const isEditing = Boolean(webhookEvent)

  const onSubmit = async (values: z.output<typeof webhookFormSchema>) => {
    const payload = {
      channelId: values.channelId,
      eventType: values.eventType,
      externalEventId: nullableString(values.externalEventId),
      payload: parseJsonRecord(values.payloadJson) ?? {},
      receivedAt: toIsoDateTime(values.receivedAt),
      processedAt: toIsoDateTime(values.processedAt),
      status: values.status,
      errorMessage: nullableString(values.errorMessage),
    }

    if (isEditing) {
      await api.patch(`/v1/distribution/webhook-events/${webhookEvent?.id}`, payload)
    } else {
      await api.post("/v1/distribution/webhook-events", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Webhook Event" : "New Webhook Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Channel</Label>
              <Select
                value={form.watch("channelId")}
                onValueChange={(value) => form.setValue("channelId", value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Event Type</Label>
                <Input {...form.register("eventType")} placeholder="booking.updated" />
              </div>
              <div className="grid gap-2">
                <Label>External Event ID</Label>
                <Input {...form.register("externalEventId")} placeholder="evt_123" />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) =>
                    form.setValue("status", value as ChannelWebhookEventRow["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {webhookStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Received At</Label>
                <Input {...form.register("receivedAt")} type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label>Processed At</Label>
                <Input {...form.register("processedAt")} type="datetime-local" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Payload JSON</Label>
              <Textarea {...form.register("payloadJson")} className="min-h-40 font-mono text-xs" />
            </div>
            <div className="grid gap-2">
              <Label>Error Message</Label>
              <Textarea
                {...form.register("errorMessage")}
                placeholder="Optional processor failure details..."
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Webhook Event" : "Create Webhook Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
