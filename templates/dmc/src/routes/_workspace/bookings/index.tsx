import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Loader2, Plus, Search } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Input } from "@/components/ui"

import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { api } from "@/lib/api-client"

import { BookingDialog } from "./_components/booking-dialog"

type BookingRow = {
  id: string
  bookingNumber: string
  status: "draft" | "confirmed" | "in_progress" | "completed" | "cancelled"
  sellCurrency: string
  sellAmountCents: number | null
  pax: number | null
  personId: string | null
  organizationId: string | null
  startDate: string | null
  createdAt: string
}

type BookingListResponse = {
  data: BookingRow[]
  total: number
  limit: number
  offset: number
}

function getBookingsListQueryOptions(search = "") {
  return queryOptions({
    queryKey: ["bookings", search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const qs = params.toString()
      return api.get<BookingListResponse>(`/v1/bookings${qs ? `?${qs}` : ""}`)
    },
  })
}

export const Route = createFileRoute("/_workspace/bookings/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getBookingsListQueryOptions()),
  component: BookingsPage,
})

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  confirmed: "default",
  in_progress: "secondary",
  completed: "default",
  cancelled: "destructive",
}

function formatAmount(cents: number | null, currency: string): string {
  if (cents == null) return "-"
  return `${(cents / 100).toFixed(2)} ${currency}`
}

function formatStatus(status: string): string {
  return status.replace("_", " ")
}

const columns: ColumnDef<BookingRow>[] = [
  {
    accessorKey: "bookingNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Booking #" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] ?? "secondary"} className="capitalize">
        {formatStatus(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "sellAmountCents",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sell Amount" />,
    cell: ({ row }) => formatAmount(row.original.sellAmountCents, row.original.sellCurrency),
  },
  {
    accessorKey: "pax",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pax" />,
    cell: ({ row }) => row.original.pax ?? "-",
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
    cell: ({ row }) => row.original.startDate ?? "-",
  },
]

function BookingsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isPending, refetch } = useQuery(getBookingsListQueryOptions(search))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Manage bookings, confirmations, and travelers.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search bookings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          onRowClick={(row) => {
            void navigate({ to: "/bookings/$id", params: { id: row.original.id } })
          }}
        />
      )}

      {data && (
        <p className="text-sm text-muted-foreground">
          Showing {data.data.length} of {data.total} bookings
        </p>
      )}

      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          void refetch()
        }}
      />
    </div>
  )
}
