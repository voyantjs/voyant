import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo } from "react"
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
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type ProductLite = { id: string; name: string; code: string | null }
type OptionLite = { id: string; productId: string; name: string; code: string | null }
type CatalogLite = { id: string; name: string; code: string }
type ScheduleLite = { id: string; name: string }
type PolicyLite = { id: string; name: string }

const PRICING_MODES = ["per_person", "per_booking", "starting_from", "free", "on_request"] as const
type PricingMode = (typeof PRICING_MODES)[number]

const formSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  optionId: z.string().min(1, "Option is required"),
  priceCatalogId: z.string().min(1, "Catalog is required"),
  priceScheduleId: z.string().optional().nullable(),
  cancellationPolicyId: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  pricingMode: z.enum(PRICING_MODES),
  baseSell: z.coerce.number().min(0),
  baseCost: z.coerce.number().min(0),
  minPerBooking: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  maxPerBooking: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  allPricingCategories: z.boolean(),
  isDefault: z.boolean(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type SettingsOptionPriceRuleData = {
  id: string
  productId: string
  optionId: string
  priceCatalogId: string
  priceScheduleId: string | null
  cancellationPolicyId: string | null
  name: string
  code: string | null
  description: string | null
  pricingMode: PricingMode
  baseSellAmountCents: number | null
  baseCostAmountCents: number | null
  minPerBooking: number | null
  maxPerBooking: number | null
  allPricingCategories: boolean
  isDefault: boolean
  active: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: SettingsOptionPriceRuleData
  onSuccess: () => void
}

const toInt = (v: number | "" | null | undefined): number | null =>
  typeof v === "number" ? v : null

export function SettingsOptionPriceRuleDialog({ open, onOpenChange, rule, onSuccess }: Props) {
  const isEditing = !!rule

  const productsQuery = useQuery({
    queryKey: ["settings", "opr-dialog", "products"],
    queryFn: () => api.get<ListResponse<ProductLite>>("/v1/products/products?limit=200"),
    enabled: open,
  })
  const catalogsQuery = useQuery({
    queryKey: ["settings", "opr-dialog", "catalogs"],
    queryFn: () => api.get<ListResponse<CatalogLite>>("/v1/pricing/price-catalogs?limit=200"),
    enabled: open,
  })
  const schedulesQuery = useQuery({
    queryKey: ["settings", "opr-dialog", "schedules"],
    queryFn: () => api.get<ListResponse<ScheduleLite>>("/v1/pricing/price-schedules?limit=200"),
    enabled: open,
  })
  const policiesQuery = useQuery({
    queryKey: ["settings", "opr-dialog", "policies"],
    queryFn: () => api.get<ListResponse<PolicyLite>>("/v1/pricing/cancellation-policies?limit=200"),
    enabled: open,
  })

  const products = productsQuery.data?.data ?? []
  const catalogs = catalogsQuery.data?.data ?? []
  const schedules = schedulesQuery.data?.data ?? []
  const policies = policiesQuery.data?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      optionId: "",
      priceCatalogId: "",
      priceScheduleId: "",
      cancellationPolicyId: "",
      name: "",
      code: "",
      description: "",
      pricingMode: "per_person",
      baseSell: 0,
      baseCost: 0,
      minPerBooking: "",
      maxPerBooking: "",
      allPricingCategories: true,
      isDefault: false,
      active: true,
      notes: "",
    },
  })

  const watchedProductId = form.watch("productId")

  const optionsQuery = useQuery({
    queryKey: ["settings", "opr-dialog", "options", watchedProductId],
    queryFn: () =>
      api.get<ListResponse<OptionLite>>(
        `/v1/products/product-options?productId=${watchedProductId}&limit=200`,
      ),
    enabled: open && !!watchedProductId,
  })
  const options = useMemo(() => optionsQuery.data?.data ?? [], [optionsQuery.data])

  useEffect(() => {
    if (open && rule) {
      form.reset({
        productId: rule.productId,
        optionId: rule.optionId,
        priceCatalogId: rule.priceCatalogId,
        priceScheduleId: rule.priceScheduleId ?? "",
        cancellationPolicyId: rule.cancellationPolicyId ?? "",
        name: rule.name,
        code: rule.code ?? "",
        description: rule.description ?? "",
        pricingMode: rule.pricingMode,
        baseSell: rule.baseSellAmountCents != null ? rule.baseSellAmountCents / 100 : 0,
        baseCost: rule.baseCostAmountCents != null ? rule.baseCostAmountCents / 100 : 0,
        minPerBooking: rule.minPerBooking ?? "",
        maxPerBooking: rule.maxPerBooking ?? "",
        allPricingCategories: rule.allPricingCategories,
        isDefault: rule.isDefault,
        active: rule.active,
        notes: rule.notes ?? "",
      })
    } else if (open) {
      form.reset({
        productId: "",
        optionId: "",
        priceCatalogId: "",
        priceScheduleId: "",
        cancellationPolicyId: "",
        name: "",
        code: "",
        description: "",
        pricingMode: "per_person",
        baseSell: 0,
        baseCost: 0,
        minPerBooking: "",
        maxPerBooking: "",
        allPricingCategories: true,
        isDefault: false,
        active: true,
        notes: "",
      })
    }
  }, [open, rule, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      productId: values.productId,
      optionId: values.optionId,
      priceCatalogId: values.priceCatalogId,
      priceScheduleId: values.priceScheduleId || null,
      cancellationPolicyId: values.cancellationPolicyId || null,
      name: values.name,
      code: values.code || null,
      description: values.description || null,
      pricingMode: values.pricingMode,
      baseSellAmountCents: Math.round(values.baseSell * 100),
      baseCostAmountCents: Math.round(values.baseCost * 100),
      minPerBooking: toInt(values.minPerBooking),
      maxPerBooking: toInt(values.maxPerBooking),
      allPricingCategories: values.allPricingCategories,
      isDefault: values.isDefault,
      active: values.active,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/pricing/option-price-rules/${rule.id}`, payload)
    } else {
      await api.post("/v1/pricing/option-price-rules", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Option Price Rule" : "Add Option Price Rule"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Product</Label>
                <select
                  {...form.register("productId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={isEditing}
                >
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.code ? ` (${p.code})` : ""}
                    </option>
                  ))}
                </select>
                {form.formState.errors.productId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.productId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Option</Label>
                <select
                  {...form.register("optionId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={isEditing || !watchedProductId}
                >
                  <option value="">Select…</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {o.code ? ` (${o.code})` : ""}
                    </option>
                  ))}
                </select>
                {form.formState.errors.optionId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.optionId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Catalog</Label>
                <select
                  {...form.register("priceCatalogId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select…</option>
                  {catalogs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.priceCatalogId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.priceCatalogId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Schedule (optional)</Label>
                <select
                  {...form.register("priceScheduleId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Cancellation policy (optional)</Label>
                <select
                  {...form.register("cancellationPolicyId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Pricing mode</Label>
                <Select
                  value={form.watch("pricingMode")}
                  onValueChange={(v) => form.setValue("pricingMode", v as PricingMode)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_MODES.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">
                        {m.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Base sell ($)</Label>
                <Input {...form.register("baseSell")} type="number" step="0.01" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Base cost ($)</Label>
                <Input {...form.register("baseCost")} type="number" step="0.01" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Min per booking</Label>
                <Input {...form.register("minPerBooking")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Max per booking</Label>
                <Input {...form.register("maxPerBooking")} type="number" min="0" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("allPricingCategories")}
                  onCheckedChange={(v) => form.setValue("allPricingCategories", v)}
                />
                <Label>All pricing categories</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isDefault")}
                  onCheckedChange={(v) => form.setValue("isDefault", v)}
                />
                <Label>Default</Label>
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
              <Label>Description</Label>
              <Textarea {...form.register("description")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
