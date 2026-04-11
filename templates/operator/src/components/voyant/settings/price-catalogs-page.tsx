"use client"

import {
  type PriceCatalogRecord,
  usePriceCatalogMutation,
  usePriceCatalogs,
} from "@voyantjs/pricing-react"
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
import { zodResolver } from "@/lib/zod-resolver"

const PAGE_SIZE = 25

const CURRENCY_OPTIONS = Object.values(currencies).map((currency) => ({
  value: currency.code,
  label: `${currency.code} — ${currency.name} (${currency.symbol})`,
}))

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
  currencyCode: z.string().length(3).optional().nullable().or(z.literal("")),
  catalogType: z.enum(["public", "contract", "net", "gross", "promo", "internal", "other"]),
  isDefault: z.boolean(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type CatalogFormValues = z.input<typeof catalogFormSchema>
type CatalogFormOutput = z.output<typeof catalogFormSchema>

export function PriceCatalogsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PriceCatalogRecord | undefined>()
  const [pageIndex, setPageIndex] = useState(0)
  const { data, isPending, refetch } = usePriceCatalogs({
    limit: PAGE_SIZE,
    offset: pageIndex * PAGE_SIZE,
  })
  const { remove } = usePriceCatalogMutation()

  const catalogs = data?.data ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Price Catalogs</h2>
          <p className="text-sm text-muted-foreground">
            Create named price books with currency and pricing posture.
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
            {catalogs.map((catalog) => (
              <div key={catalog.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{catalog.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{catalog.code}</span>
                  <Badge variant="outline" className="text-xs">
                    {catalog.currencyCode}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {catalog.catalogType}
                  </Badge>
                  {catalog.isDefault ? (
                    <Badge variant="default" className="text-xs">
                      Default
                    </Badge>
                  ) : null}
                  {!catalog.active ? (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  ) : null}
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
                        setEditing(catalog)
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
                          remove.mutate(catalog.id, { onSuccess: () => void refetch() })
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {catalogs.length} of {total}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
          >
            Previous
          </Button>
          <span>
            Page {pageIndex + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(pageIndex + 1) * PAGE_SIZE >= total}
            onClick={() => setPageIndex((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <CatalogSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        catalog={editing}
        onSuccess={() => {
          setSheetOpen(false)
          setEditing(undefined)
          void refetch()
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
    <Combobox
      items={CURRENCY_OPTIONS}
      value={value}
      onValueChange={(next) => onChange(String(next ?? ""))}
    >
      <ComboboxInput placeholder="Select currency..." />
      <ComboboxContent>
        <ComboboxEmpty>No currencies found.</ComboboxEmpty>
        <ComboboxList>
          {CURRENCY_OPTIONS.map((option) => (
            <ComboboxItem key={option.value} value={option.value}>
              {option.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function CatalogSheet({
  open,
  onOpenChange,
  catalog,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog?: PriceCatalogRecord
  onSuccess: () => void
}) {
  const isEditing = !!catalog
  const { create, update } = usePriceCatalogMutation()

  const form = useForm<CatalogFormValues, unknown, CatalogFormOutput>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      name: "",
      code: "",
      currencyCode: "",
      catalogType: "public",
      isDefault: false,
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && catalog) {
      form.reset({
        name: catalog.name,
        code: catalog.code,
        currencyCode: catalog.currencyCode ?? "",
        catalogType: catalog.catalogType,
        isDefault: catalog.isDefault,
        active: catalog.active,
        notes: catalog.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [open, catalog, form])

  const isSubmitting = create.isPending || update.isPending

  const onSubmit = async (values: CatalogFormOutput) => {
    const payload = {
      name: values.name,
      code: values.code,
      currencyCode: values.currencyCode || null,
      catalogType: values.catalogType,
      isDefault: values.isDefault,
      active: values.active,
      notes: values.notes || null,
    }

    if (isEditing) {
      await update.mutateAsync({ id: catalog.id, input: payload })
    } else {
      await create.mutateAsync(payload)
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
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="EUR-PUBLIC" />
                {form.formState.errors.code ? (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <CurrencyCombobox
                  value={form.watch("currencyCode") ?? ""}
                  onChange={(value) =>
                    form.setValue("currencyCode", value || null, { shouldDirty: true })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={form.watch("catalogType")}
                  onValueChange={(value) =>
                    form.setValue("catalogType", value as CatalogFormValues["catalogType"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATALOG_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
                  onCheckedChange={(checked) => form.setValue("isDefault", checked)}
                />
                <Label>Default catalog</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(checked) => form.setValue("active", checked)}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Input {...form.register("notes")} placeholder="Optional notes" />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? "Save Changes" : "Create Catalog"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
