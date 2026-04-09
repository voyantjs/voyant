import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Globe, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import { getApiListQueryOptions } from "../_lib/api-query-options"
import { MarketCurrenciesTab } from "./_components/market-currencies-tab"
import { type MarketData, MarketDialog } from "./_components/market-dialog"
import { MarketLocalesTab } from "./_components/market-locales-tab"

export const Route = createFileRoute("/_workspace/markets/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getMarketsQueryOptions()),
  component: MarketsPage,
})

function MarketsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MarketData | undefined>()
  const [selectedMarketId, setSelectedMarketId] = useState<string>("")

  const { data, isPending, refetch } = useQuery(getMarketsQueryOptions())

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/markets/markets/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []
  const selectedMarket = rows.find((m) => m.id === selectedMarketId)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Globe className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Geographic markets with their default currency, language and tax context.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Market
          </Button>
        </div>

        {isPending && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isPending && rows.length === 0 && (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No markets yet.</p>
          </div>
        )}

        {!isPending && rows.length > 0 && (
          <div className="rounded-md border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="p-3 text-left font-medium">Code</th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Country</th>
                  <th className="p-3 text-left font-medium">Language</th>
                  <th className="p-3 text-left font-medium">Currency</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="w-32 p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b last:border-b-0 ${
                      selectedMarketId === row.id ? "bg-accent/30" : ""
                    }`}
                  >
                    <td className="p-3 font-mono text-xs">{row.code}</td>
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {row.countryCode ?? "-"}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {row.defaultLanguageTag}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {row.defaultCurrency}
                    </td>
                    <td className="p-3">
                      <Badge variant={row.status === "active" ? "default" : "outline"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedMarketId(row.id)}
                          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          Configure
                        </button>
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
                            if (confirm(`Delete market "${row.name}"?`)) {
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
      </div>

      {selectedMarket && (
        <div className="flex flex-col gap-3 rounded-md border bg-background p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Configuring</p>
              <p className="font-medium">
                {selectedMarket.name} ({selectedMarket.code})
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMarketId("")}>
              Close
            </Button>
          </div>
          <Tabs defaultValue="locales" className="w-full">
            <TabsList>
              <TabsTrigger value="locales">Locales</TabsTrigger>
              <TabsTrigger value="currencies">Currencies</TabsTrigger>
            </TabsList>
            <TabsContent value="locales" className="mt-4">
              <MarketLocalesTab marketId={selectedMarket.id} />
            </TabsContent>
            <TabsContent value="currencies" className="mt-4">
              <MarketCurrenciesTab marketId={selectedMarket.id} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <MarketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        market={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}

function getMarketsQueryOptions() {
  return getApiListQueryOptions<MarketData>(["markets"], "/v1/markets/markets?limit=200")
}
