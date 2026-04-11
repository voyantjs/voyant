import type { ColumnDef } from "@tanstack/react-table"
import { type OfferRecord, useOfferMutation, useOffers } from "@voyantjs/transactions-react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge, Button } from "@/components/ui"
import { DataTable } from "@/components/ui/data-table"
import { OfferDialog } from "./offer-dialog"

const PAGE_SIZE = 25

function formatMoney(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

export function OffersTab() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OfferRecord | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const { data, isPending, refetch } = useOffers({
    limit: PAGE_SIZE,
    offset: pageIndex * PAGE_SIZE,
  })
  const { remove } = useOfferMutation()

  const columns = useMemo<ColumnDef<OfferRecord>[]>(
    () => [
      {
        accessorKey: "offerNumber",
        header: "Number",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.offerNumber}</span>,
      },
      {
        accessorKey: "title",
        header: "Title",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "accepted" ? "default" : "outline"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "totalAmountCents",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {formatMoney(row.original.totalAmountCents, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "validUntil",
        header: "Valid Until",
        cell: ({ row }) =>
          row.original.validUntil ? new Date(row.original.validUntil).toLocaleDateString() : "-",
      },
      {
        id: "actions",
        header: () => <div className="w-20" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setEditing(row.original)
                setDialogOpen(true)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete offer "${row.original.offerNumber}"?`)) {
                  remove.mutate(row.original.id, { onSuccess: () => void refetch() })
                }
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [refetch, remove],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Priced proposals sent to customers. Each offer can be converted into an order.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Offer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        emptyMessage={isPending ? "Loading offers..." : "No offers yet."}
        pagination={{
          pageIndex,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
        }}
      />

      <OfferDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        offer={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
