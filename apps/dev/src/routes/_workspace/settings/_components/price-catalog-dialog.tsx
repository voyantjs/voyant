import { currencies } from "@voyantjs/utils/currencies"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/components/ui"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const CURRENCY_CODES = Object.keys(currencies).sort()

const catalogFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(100),
  name: z.string().min(1, "Name is required").max(255),
  currencyCode: z
    .string()
    .length(3, "Use 3-letter ISO code")
    .regex(/^[A-Z]{3}$/, "Must be uppercase"),
  catalogType: z.enum(["public", "contract", "net", "gross", "promo", "internal", "other"]),
  isDefault: z.boolean(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type CatalogFormValues = z.input<typeof catalogFormSchema>
type CatalogFormOutput = z.output<typeof catalogFormSchema>

export type PriceCatalogData = {
  id: string
  code: string
  name: string
  currencyCode: string
  catalogType: "public" | "contract" | "net" | "gross" | "promo" | "internal" | "other"
  isDefault: boolean
  active: boolean
  notes: string | null
}

type PriceCatalogDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog?: PriceCatalogData
  onSuccess: () => void
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

export function PriceCatalogDialog({
  open,
  onOpenChange,
  catalog,
  onSuccess,
}: PriceCatalogDialogProps) {
  const isEditing = !!catalog

  const form = useForm<CatalogFormValues, unknown, CatalogFormOutput>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      code: "",
      name: "",
      currencyCode: "EUR",
      catalogType: "public",
      isDefault: false,
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && catalog) {
      form.reset({
        code: catalog.code,
        name: catalog.name,
        currencyCode: catalog.currencyCode,
        catalogType: catalog.catalogType,
        isDefault: catalog.isDefault,
        active: catalog.active,
        notes: catalog.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [open, catalog, form])

  const onSubmit = async (values: CatalogFormOutput) => {
    const payload = {
      code: values.code,
      name: values.name,
      currencyCode: values.currencyCode,
      catalogType: values.catalogType,
      isDefault: values.isDefault,
      active: values.active,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/pricing/price-catalogs/${catalog.id}`, payload)
    } else {
      await api.post("/v1/pricing/price-catalogs", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Price Catalog" : "New Price Catalog"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="public-eur" />
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Public EUR Pricing" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={form.watch("catalogType")}
                  onValueChange={(v) =>
                    form.setValue("catalogType", v as CatalogFormValues["catalogType"])
                  }
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
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Combobox
                  items={CURRENCY_CODES}
                  value={form.watch("currencyCode") || null}
                  autoHighlight
                  filter={(code, query) => {
                    const c = currencies[code as keyof typeof currencies]
                    if (!c) return false
                    const q = query.toLowerCase()
                    return (
                      c.code.toLowerCase().includes(q) ||
                      c.name.toLowerCase().includes(q) ||
                      c.symbol.toLowerCase().includes(q)
                    )
                  }}
                  onValueChange={(next) => {
                    if (typeof next === "string") {
                      form.setValue("currencyCode", next, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  }}
                >
                  <ComboboxInput placeholder="Search currency…" />
                  <ComboboxContent>
                    <ComboboxEmpty>No currencies found</ComboboxEmpty>
                    <ComboboxList>
                      <ComboboxCollection>
                        {(code: string) => {
                          const c = currencies[code as keyof typeof currencies]
                          return (
                            <ComboboxItem key={code} value={code}>
                              <span className="min-w-10 font-mono text-xs text-muted-foreground">
                                {code}
                              </span>
                              <span className="truncate">{c?.name ?? code}</span>
                            </ComboboxItem>
                          )
                        }}
                      </ComboboxCollection>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {form.formState.errors.currencyCode && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.currencyCode.message}
                  </p>
                )}
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

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Internal description…" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Catalog"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
