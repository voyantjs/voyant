import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button } from "@/components/ui"
import { api } from "@/lib/api-client"
import {
  type SettingsOptionPriceRuleData,
  SettingsOptionPriceRuleDialog,
} from "../_components/settings-option-price-rule-dialog"
import { getPricingSettingsListQueryOptions } from "../_lib/pricing-query-options"

export const Route = createFileRoute("/_workspace/settings/pricing/option-price-rules")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getOptionPriceRulesQueryOptions()),
      context.queryClient.ensureQueryData(getOptionPriceRuleProductsQueryOptions()),
      context.queryClient.ensureQueryData(getOptionPriceRuleOptionsQueryOptions()),
      context.queryClient.ensureQueryData(getOptionPriceRuleCatalogsQueryOptions()),
    ]),
  component: OptionPriceRulesPage,
})
type ProductLite = { id: string; name: string; code: string | null }
type OptionLite = { id: string; name: string; code: string | null }
type CatalogLite = { id: string; name: string; code: string }

function OptionPriceRulesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SettingsOptionPriceRuleData | undefined>()

  const { data, isPending, refetch } = useQuery(getOptionPriceRulesQueryOptions())

  const productsQuery = useQuery(getOptionPriceRuleProductsQueryOptions())
  const optionsQuery = useQuery(getOptionPriceRuleOptionsQueryOptions())
  const catalogsQuery = useQuery(getOptionPriceRuleCatalogsQueryOptions())
  const productById = new Map((productsQuery.data?.data ?? []).map((p) => [p.id, p]))
  const optionById = new Map((optionsQuery.data?.data ?? []).map((o) => [o.id, o]))
  const catalogById = new Map((catalogsQuery.data?.data ?? []).map((c) => [c.id, c]))

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/option-price-rules/${id}`),
    onSuccess: () => {
      void refetch()
    },
  })

  const rows = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Option Price Rules</h2>
          <p className="text-sm text-muted-foreground">
            Base price rules per product-option × catalog. Child rules attach to these.
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
          New Rule
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && rows.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No option price rules yet.</p>
        </div>
      )}

      {!isPending && rows.length > 0 && (
        <div className="rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Product</th>
                <th className="p-3 text-left font-medium">Option</th>
                <th className="p-3 text-left font-medium">Catalog</th>
                <th className="p-3 text-left font-medium">Mode</th>
                <th className="p-3 text-left font-medium">Base sell</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const product = productById.get(row.productId)
                const option = optionById.get(row.optionId)
                const catalog = catalogById.get(row.priceCatalogId)
                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="p-3">{row.name}</td>
                    <td className="p-3 text-muted-foreground">{product?.name ?? row.productId}</td>
                    <td className="p-3 text-muted-foreground">{option?.name ?? row.optionId}</td>
                    <td className="p-3 text-muted-foreground">
                      {catalog?.name ?? row.priceCatalogId}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">
                        {row.pricingMode.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {row.baseSellAmountCents != null
                        ? (row.baseSellAmountCents / 100).toFixed(2)
                        : "-"}
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
                            if (confirm("Delete rule?")) {
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <SettingsOptionPriceRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editing}
        onSuccess={() => {
          setDialogOpen(false)
          setEditing(undefined)
          void refetch()
        }}
      />
    </div>
  )
}

function getOptionPriceRulesQueryOptions() {
  return getPricingSettingsListQueryOptions<SettingsOptionPriceRuleData>(
    ["pricing", "option-price-rules"],
    "/v1/pricing/option-price-rules?limit=200",
  )
}

function getOptionPriceRuleProductsQueryOptions() {
  return getPricingSettingsListQueryOptions<ProductLite>(
    ["pricing", "opr-list", "products"],
    "/v1/products/products?limit=200",
  )
}

function getOptionPriceRuleOptionsQueryOptions() {
  return getPricingSettingsListQueryOptions<OptionLite>(
    ["pricing", "opr-list", "options"],
    "/v1/products/product-options?limit=200",
  )
}

function getOptionPriceRuleCatalogsQueryOptions() {
  return getPricingSettingsListQueryOptions<CatalogLite>(
    ["pricing", "opr-list", "catalogs"],
    "/v1/pricing/price-catalogs?limit=200",
  )
}
