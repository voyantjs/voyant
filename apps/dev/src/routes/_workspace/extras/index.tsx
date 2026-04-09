import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Label } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { type ProductExtraData, ProductExtraDialog } from "./_components/product-extra-dialog"

export const Route = createFileRoute("/_workspace/extras/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getExtrasProductsQueryOptions()),
  component: ExtrasPage,
})

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type ProductLite = { id: string; name: string; code: string | null; status: string }

function getExtrasProductsQueryOptions() {
  return queryOptions({
    queryKey: ["extras", "products"],
    queryFn: () => api.get<ListResponse<ProductLite>>("/v1/products?limit=200"),
  })
}

function getProductExtrasQueryOptions(productId: string) {
  return queryOptions({
    queryKey: ["product-extras", productId],
    queryFn: () =>
      api.get<ListResponse<ProductExtraData>>(
        `/v1/extras/product-extras?productId=${productId}&limit=200`,
      ),
  })
}

function ExtrasPage() {
  const [productId, setProductId] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProductExtraData | undefined>()

  const productsQuery = useQuery(getExtrasProductsQueryOptions())
  const products = productsQuery.data?.data ?? []

  const { data, isPending, refetch } = useQuery({
    ...getProductExtrasQueryOptions(productId),
    enabled: !!productId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/extras/product-extras/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = (data?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const nextSort = rows.length > 0 ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Extras</h1>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <Label>Product</Label>
        <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a product…" />
          </SelectTrigger>
          <SelectContent>
            {products.length === 0 && (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                {productsQuery.isPending ? "Loading…" : "No products"}
              </div>
            )}
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
                {p.code ? ` · ${p.code}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Pick a product to manage optional add-ons (transfers, upgrades, tastings, etc.).
        </p>
      </div>

      {!productId && (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a product above to configure its extras.
          </p>
        </div>
      )}

      {productId && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Product Extras</h2>
              <p className="text-sm text-muted-foreground">
                Optional add-ons travelers can select during booking.
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
              Add Extra
            </Button>
          </div>

          {isPending && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isPending && rows.length === 0 && (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No extras yet. Add one to start offering add-ons.
              </p>
            </div>
          )}

          {!isPending && rows.length > 0 && (
            <div className="rounded-md border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Code</th>
                    <th className="p-3 text-left font-medium">Selection</th>
                    <th className="p-3 text-left font-medium">Pricing</th>
                    <th className="p-3 text-left font-medium">Qty</th>
                    <th className="p-3 text-left font-medium">Sort</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="w-20 p-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="p-3 font-medium">{row.name}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {row.code ?? "-"}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize">
                          {row.selectionType.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="capitalize">
                          {row.pricingMode.replace("_", " ")}
                        </Badge>
                        {row.pricedPerPerson && (
                          <Badge variant="outline" className="ml-1">
                            per person
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {formatQty(row)}
                      </td>
                      <td className="p-3 font-mono text-xs">{row.sortOrder}</td>
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
                              if (confirm(`Delete extra "${row.name}"?`)) {
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
      )}

      {productId && (
        <ProductExtraDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          productId={productId}
          extra={editing}
          nextSortOrder={nextSort}
          onSuccess={() => {
            setDialogOpen(false)
            setEditing(undefined)
            void refetch()
          }}
        />
      )}
    </div>
  )
}

function formatQty(row: ProductExtraData): string {
  const parts: string[] = []
  if (row.minQuantity != null) parts.push(`min ${row.minQuantity}`)
  if (row.maxQuantity != null) parts.push(`max ${row.maxQuantity}`)
  if (row.defaultQuantity != null) parts.push(`default ${row.defaultQuantity}`)
  return parts.length > 0 ? parts.join(" · ") : "-"
}
