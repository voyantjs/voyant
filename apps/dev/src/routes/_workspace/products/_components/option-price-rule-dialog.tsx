import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
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

type CatalogOption = { id: string; name: string; code: string; currencyCode: string }
type ScheduleOption = { id: string; name: string }
type PolicyOption = { id: string; name: string }

const ruleFormSchema = z.object({
  priceCatalogId: z.string().min(1, "Catalog is required"),
  priceScheduleId: z.string().optional().nullable(),
  cancellationPolicyId: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  pricingMode: z.enum(["per_person", "per_booking", "starting_from", "free", "on_request"]),
  baseSell: z.coerce.number().min(0),
  baseCost: z.coerce.number().min(0),
  minPerBooking: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  maxPerBooking: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  allPricingCategories: z.boolean(),
  isDefault: z.boolean(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type RuleFormValues = z.input<typeof ruleFormSchema>
type RuleFormOutput = z.output<typeof ruleFormSchema>

export type OptionPriceRuleData = {
  id: string
  productId: string
  optionId: string
  priceCatalogId: string
  priceScheduleId: string | null
  cancellationPolicyId: string | null
  name: string
  code: string | null
  description: string | null
  pricingMode: "per_person" | "per_booking" | "starting_from" | "free" | "on_request"
  baseSellAmountCents: number
  baseCostAmountCents: number
  minPerBooking: number | null
  maxPerBooking: number | null
  allPricingCategories: boolean
  isDefault: boolean
  active: boolean
  notes: string | null
}

type OptionPriceRuleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  optionId: string
  rule?: OptionPriceRuleData
  onSuccess: () => void
}

const PRICING_MODES = [
  { value: "per_person", label: "Per Person" },
  { value: "per_booking", label: "Per Booking" },
  { value: "starting_from", label: "Starting From" },
  { value: "free", label: "Free" },
  { value: "on_request", label: "On Request" },
] as const

export function OptionPriceRuleDialog({
  open,
  onOpenChange,
  productId,
  optionId,
  rule,
  onSuccess,
}: OptionPriceRuleDialogProps) {
  const isEditing = !!rule
  const [catalogs, setCatalogs] = useState<CatalogOption[]>([])
  const [schedules, setSchedules] = useState<ScheduleOption[]>([])
  const [policies, setPolicies] = useState<PolicyOption[]>([])

  const form = useForm<RuleFormValues, unknown, RuleFormOutput>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
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

  useEffect(() => {
    if (!open) return
    void api
      .get<{ data: CatalogOption[] }>("/v1/pricing/price-catalogs?limit=200")
      .then((res) => setCatalogs(res.data ?? []))
    void api
      .get<{ data: ScheduleOption[] }>("/v1/pricing/price-schedules?limit=200")
      .then((res) => setSchedules(res.data ?? []))
    void api
      .get<{ data: PolicyOption[] }>("/v1/pricing/cancellation-policies?limit=200")
      .then((res) => setPolicies(res.data ?? []))
  }, [open])

  useEffect(() => {
    if (open && rule) {
      form.reset({
        priceCatalogId: rule.priceCatalogId,
        priceScheduleId: rule.priceScheduleId ?? "",
        cancellationPolicyId: rule.cancellationPolicyId ?? "",
        name: rule.name,
        code: rule.code ?? "",
        description: rule.description ?? "",
        pricingMode: rule.pricingMode,
        baseSell: rule.baseSellAmountCents / 100,
        baseCost: rule.baseCostAmountCents / 100,
        minPerBooking: rule.minPerBooking ?? "",
        maxPerBooking: rule.maxPerBooking ?? "",
        allPricingCategories: rule.allPricingCategories,
        isDefault: rule.isDefault,
        active: rule.active,
        notes: rule.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [open, rule, form])

  const onSubmit = async (values: RuleFormOutput) => {
    const payload = {
      productId,
      optionId,
      priceCatalogId: values.priceCatalogId,
      priceScheduleId: values.priceScheduleId || null,
      cancellationPolicyId: values.cancellationPolicyId || null,
      name: values.name,
      code: values.code || null,
      description: values.description || null,
      pricingMode: values.pricingMode,
      baseSellAmountCents: Math.round(values.baseSell * 100),
      baseCostAmountCents: Math.round(values.baseCost * 100),
      minPerBooking: typeof values.minPerBooking === "number" ? values.minPerBooking : null,
      maxPerBooking: typeof values.maxPerBooking === "number" ? values.maxPerBooking : null,
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
          <DialogTitle>{isEditing ? "Edit Price Rule" : "New Price Rule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Catalog</Label>
                <select
                  {...form.register("priceCatalogId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select…</option>
                  {catalogs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code} · {c.currencyCode})
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
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Public Rate" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Pricing mode</Label>
                <Select
                  value={form.watch("pricingMode")}
                  onValueChange={(v) =>
                    form.setValue("pricingMode", v as RuleFormValues["pricingMode"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Base sell</Label>
                <Input {...form.register("baseSell")} type="number" step="0.01" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Base cost</Label>
                <Input {...form.register("baseCost")} type="number" step="0.01" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="public-eur" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Input {...form.register("description")} />
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

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("allPricingCategories")}
                  onCheckedChange={(v) => form.setValue("allPricingCategories", v)}
                />
                <Label>All categories</Label>
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
              {isEditing ? "Save Changes" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
