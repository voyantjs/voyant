import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { currencies } from "@voyantjs/utils/currencies"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
} from "@/components/ui"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const CURRENCY_OPTIONS = Object.values(currencies).map((c) => ({
  value: c.code,
  label: `${c.code} — ${c.name} (${c.symbol})`,
}))

export const Route = createFileRoute("/_workspace/settings/price-catalogs")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getPriceCatalogsQueryOptions()),
  component: PriceCatalogsPage,
})

type PriceCatalog = {
  id: string
  code: string
  name: string
  currencyCode: string | null
  catalogType: string
  isDefault: boolean
  active: boolean
}

const CATALOG_TYPES = [
  { value: "public", label: "Public" },
  { value: "contract", label: "Contract" },
  { value: "net", label: "Net" },
  { value: "gross", label: "Gross" },
  { value: "promo", label: "Promo" },
  { value: "internal", label: "Internal" },
  { value: "other", label: "Other" },
] as const

const catalogFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().min(1, "Code is required").max(100),
  currencyCode: z.string().max(3).optional().nullable(),
  catalogType: z.enum(["public", "contract", "net", "gross", "promo", "internal", "other"]),
  isDefault: z.boolean(),
  active: z.boolean(),
})

type CatalogFormValues = z.input<typeof catalogFormSchema>
type CatalogFormOutput = z.output<typeof catalogFormSchema>

function getPriceCatalogsQueryOptions() {
  return queryOptions({
    queryKey: ["price-catalogs"],
    queryFn: () => api.get<{ data: PriceCatalog[] }>("/v1/pricing/price-catalogs?limit=200"),
  })
}

function CatalogSheet({
  open,
  onOpenChange,
  catalog,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog?: PriceCatalog
  onSuccess: () => void
}) {
  const isEditing = !!catalog

  const form = useForm<CatalogFormValues, unknown, CatalogFormOutput>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      name: "",
      code: "",
      currencyCode: "",
      catalogType: "public",
      isDefault: false,
      active: true,
    },
  })

  useEffect(() => {
    if (open && catalog) {
      form.reset({
        name: catalog.name,
        code: catalog.code,
        currencyCode: catalog.currencyCode ?? "",
        catalogType: catalog.catalogType as CatalogFormValues["catalogType"],
        isDefault: catalog.isDefault,
        active: catalog.active,
      })
    } else if (open) {
      form.reset()
    }
  }, [open, catalog, form])

  const onSubmit = async (values: CatalogFormOutput) => {
    const payload = {
      ...values,
      currencyCode: values.currencyCode || null,
    }
    if (isEditing) {
      await api.patch(`/v1/pricing/price-catalogs/${catalog.id}`, payload)
    } else {
      await api.post("/v1/pricing/price-catalogs", payload)
    }
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Catalog" : "New Price Catalog"}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="EUR Public Rates" autoFocus />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="EUR-PUBLIC" />
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <CurrencyCombobox
                  value={form.watch("currencyCode") ?? ""}
                  onChange={(v) => form.setValue("currencyCode", v || null, { shouldDirty: true })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={form.watch("catalogType")}
                  onValueChange={(v) =>
                    form.setValue("catalogType", v as CatalogFormValues["catalogType"])
                  }
                  items={CATALOG_TYPES}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATALOG_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isDefault")}
                  onCheckedChange={(v) => form.setValue("isDefault", v)}
                />
                <Label>Default catalog</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                />
                <Label>Active</Label>
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Catalog"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function PriceCatalogsPage() {
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PriceCatalog | undefined>()

  const { data, isPending } = useQuery(getPriceCatalogsQueryOptions())

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/price-catalogs/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["price-catalogs"] }),
  })

  const catalogs = data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Price Catalogs</h2>
          <p className="text-sm text-muted-foreground">
            Rate cards for your products. Optionally scoped to a currency.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setSheetOpen(true)
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Catalog
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {isPending ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : catalogs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No price catalogs yet. Create a catalog to define currency-specific rate cards.
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {catalogs.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{cat.code}</span>
                  {cat.currencyCode && (
                    <Badge variant="outline" className="text-xs">
                      {cat.currencyCode}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {cat.catalogType}
                  </Badge>
                  {cat.isDefault && (
                    <Badge variant="default" className="text-xs">
                      Default
                    </Badge>
                  )}
                  {!cat.active && (
                    <Badge variant="secondary" className="text-xs">
                      inactive
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(cat)
                        setSheetOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Delete this price catalog?")) {
                          deleteMutation.mutate(cat.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      <CatalogSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        catalog={editing}
        onSuccess={() => {
          setSheetOpen(false)
          setEditing(undefined)
          void queryClient.invalidateQueries({ queryKey: ["price-catalogs"] })
        }}
      />
    </div>
  )
}

function CurrencyCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Combobox value={value} onValueChange={(v) => onChange(v ?? "")}>
      <ComboboxInput placeholder="Search currency..." className="w-full" />
      <ComboboxContent>
        <ComboboxList>
          {CURRENCY_OPTIONS.map((c) => (
            <ComboboxItem key={c.value} value={c.value}>
              <span className="font-mono text-xs">{c.value}</span>
              <span className="truncate text-muted-foreground">{c.label.split(" — ")[1]}</span>
            </ComboboxItem>
          ))}
          <ComboboxEmpty>No currency found</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
