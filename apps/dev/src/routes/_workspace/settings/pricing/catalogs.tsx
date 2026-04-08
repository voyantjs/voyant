import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import { type PriceCatalogData, PriceCatalogDialog } from "../_components/price-catalog-dialog"

export const Route = createFileRoute("/_workspace/settings/pricing/catalogs")({
  component: PriceCatalogsPage,
})

type PriceCatalogListResponse = {
  data: PriceCatalogData[]
  total: number
  limit: number
  offset: number
}

function PriceCatalogsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PriceCatalogData | undefined>()

  const { data, isPending, refetch } = useQuery({
    queryKey: ["price-catalogs"],
    queryFn: () => api.get<PriceCatalogListResponse>("/v1/pricing/price-catalogs?limit=200"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/price-catalogs/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Price Catalogs</h2>
          <p className="text-sm text-muted-foreground">
            Define named price books with a currency and type.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Catalog
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && (!data?.data || data.data.length === 0) && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No price catalogs yet. Create one to start defining option prices.
          </p>
        </div>
      )}

      {!isPending && data?.data && data.data.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Currency</th>
                <th className="p-3 text-left font-medium">Default</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="p-3 font-mono text-xs">{row.code}</td>
                  <td className="p-3">{row.name}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {row.catalogType}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono">{row.currencyCode}</td>
                  <td className="p-3">
                    {row.isDefault && <Badge variant="secondary">Default</Badge>}
                  </td>
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
                          if (confirm(`Delete catalog "${row.name}"?`)) {
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

      <PriceCatalogDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        catalog={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}
