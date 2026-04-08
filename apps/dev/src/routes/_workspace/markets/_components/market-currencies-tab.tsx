import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type MarketCurrencyData, MarketCurrencyDialog } from "./market-currency-dialog"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

type Props = { marketId: string }

export function MarketCurrenciesTab({ marketId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MarketCurrencyData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["markets", "currencies", marketId],
    queryFn: () =>
      api.get<ListResponse<MarketCurrencyData>>(
        `/v1/markets/market-currencies?marketId=${marketId}&limit=200`,
      ),
    enabled: !!marketId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/markets/market-currencies/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = (data?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Currencies accepted for display, settlement and reporting in this market.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Currency
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No currencies yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Currency</th>
                <th className="p-3 text-left font-medium">Default</th>
                <th className="p-3 text-left font-medium">Settlement</th>
                <th className="p-3 text-left font-medium">Reporting</th>
                <th className="p-3 text-left font-medium">Sort</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-mono text-xs font-medium">{row.currencyCode}</td>
                  <td className="p-3 text-muted-foreground">{row.isDefault ? "Yes" : "-"}</td>
                  <td className="p-3 text-muted-foreground">{row.isSettlement ? "Yes" : "-"}</td>
                  <td className="p-3 text-muted-foreground">{row.isReporting ? "Yes" : "-"}</td>
                  <td className="p-3 text-muted-foreground">{row.sortOrder}</td>
                  <td className="p-3">
                    <Badge variant={row.active ? "default" : "outline"}>
                      {row.active ? "Active" : "Inactive"}
                    </Badge>
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
                          if (confirm(`Delete currency "${row.currencyCode}"?`)) {
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

      <MarketCurrencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        marketId={marketId}
        currency={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
