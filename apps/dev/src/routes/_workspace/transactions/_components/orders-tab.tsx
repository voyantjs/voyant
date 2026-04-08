import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type OrderData, OrderDialog } from "./order-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

export function OrdersTab() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OrderData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["transactions", "orders"],
    queryFn: () => api.get<ListResponse<OrderData>>("/v1/transactions/orders?limit=200"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/transactions/orders/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  const formatMoney = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${currency}`

  const statusVariant = (status: string) => {
    if (status === "confirmed" || status === "fulfilled") return "default"
    if (status === "cancelled" || status === "expired") return "destructive"
    return "outline"
  }

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

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Number</th>
                <th className="p-3 text-left font-medium">Title</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Total</th>
                <th className="p-3 text-left font-medium">Ordered</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-mono text-xs">{row.orderNumber}</td>
                  <td className="p-3 font-medium">{row.title}</td>
                  <td className="p-3">
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {formatMoney(row.totalAmountCents, row.currency)}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {row.orderedAt ? new Date(row.orderedAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(row)
                          setDialogOpen(true)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete order "${row.orderNumber}"?`)) {
                            deleteMutation.mutate(row.id)
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
