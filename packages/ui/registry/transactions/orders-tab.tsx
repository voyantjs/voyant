"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { type OrderRecord, useOrderMutation, useOrders } from "@voyantjs/transactions-react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge, Button } from "@/components/ui"
import { DataTable } from "@/components/ui/data-table"
import { OrderDialog } from "./order-dialog"

const PAGE_SIZE = 25

function formatMoney(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

function statusVariant(status: string) {
  if (status === "confirmed" || status === "fulfilled") return "default" as const
  if (status === "cancelled" || status === "expired") return "destructive" as const
  return "outline" as const
}

export function OrdersTab() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OrderRecord | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const { data, isPending, refetch } = useOrders({
    limit: PAGE_SIZE,
    offset: pageIndex * PAGE_SIZE,
  })
  const { remove } = useOrderMutation()

  const columns = useMemo<ColumnDef<OrderRecord>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Number",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.orderNumber}</span>,
      },
      {
        accessorKey: "title",
        header: "Title",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge>
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
        accessorKey: "orderedAt",
        header: "Ordered",
        cell: ({ row }) =>
          row.original.orderedAt ? new Date(row.original.orderedAt).toLocaleDateString() : "-",
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
                if (confirm(`Delete order "${row.original.orderNumber}"?`)) {
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
          Committed purchases. Orders may originate from an accepted offer or be created directly.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Order
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        emptyMessage={isPending ? "Loading orders..." : "No orders yet."}
        pagination={{
          pageIndex,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onPageIndexChange: setPageIndex,
        }}
      />

      <OrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
