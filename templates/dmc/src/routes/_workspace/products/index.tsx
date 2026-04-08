import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Loader2, Plus, Search } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Input } from "@/components/ui"

import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { api } from "@/lib/api-client"

import { ProductDialog } from "./_components/product-dialog"

type ProductRow = {
  id: string
  name: string
  status: "draft" | "active" | "archived"
  sellCurrency: string
  sellAmountCents: number | null
  pax: number | null
  personId: string | null
  organizationId: string | null
  startDate: string | null
  createdAt: string
}

type ProductListResponse = {
  data: ProductRow[]
  total: number
  limit: number
  offset: number
}

export const Route = createFileRoute("/_workspace/products/")({
  component: ProductsPage,
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

const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] ?? "secondary"} className="capitalize">
        {row.original.status}
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

function ProductsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isPending, refetch } = useQuery({
    queryKey: ["products", search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const qs = params.toString()
      return api.get<ProductListResponse>(`/v1/products${qs ? `?${qs}` : ""}`)
    },
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your quotes, packages, and proposals.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
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
            void navigate({ to: "/products/$id", params: { id: row.original.id } })
          }}
        />
      )}

      {data && (
        <p className="text-sm text-muted-foreground">
          Showing {data.data.length} of {data.total} products
        </p>
      )}

      <ProductDialog
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
