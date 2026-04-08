import { useQuery } from "@tanstack/react-query"
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
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type PricingCategoryLite = { id: string; name: string; code: string | null }

const PRICING_MODES = [
  "per_unit",
  "per_person",
  "per_booking",
  "included",
  "free",
  "on_request",
] as const
type PricingMode = (typeof PRICING_MODES)[number]

const formSchema = z.object({
  optionPriceRuleId: z.string().min(1, "Option price rule is required"),
  optionId: z.string().min(1, "Option ID is required"),
  unitId: z.string().min(1, "Unit ID is required"),
  pricingCategoryId: z.string().optional().nullable(),
  pricingMode: z.enum(PRICING_MODES),
  sellAmount: z.coerce.number().min(0).optional().or(z.literal("")).nullable(),
  costAmount: z.coerce.number().min(0).optional().or(z.literal("")).nullable(),
  minQuantity: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  maxQuantity: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type OptionUnitPriceRuleData = {
  id: string
  optionPriceRuleId: string
  optionId: string
  unitId: string
  pricingCategoryId: string | null
  pricingMode: PricingMode
  sellAmountCents: number | null
  costAmountCents: number | null
  minQuantity: number | null
  maxQuantity: number | null
  sortOrder: number
  active: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: OptionUnitPriceRuleData
  onSuccess: () => void
}

const toInt = (v: number | "" | null | undefined): number | null =>
  typeof v === "number" ? v : null
const toCents = (v: number | "" | null | undefined): number | null =>
  typeof v === "number" ? Math.round(v * 100) : null

export function OptionUnitPriceRuleDialog({ open, onOpenChange, rule, onSuccess }: Props) {
  const isEditing = !!rule

  const categoriesQuery = useQuery({
    queryKey: ["settings", "oupr-dialog", "categories"],
    queryFn: () =>
      api.get<ListResponse<PricingCategoryLite>>("/v1/pricing/pricing-categories?limit=200"),
    enabled: open,
  })
  const categories = categoriesQuery.data?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      optionPriceRuleId: "",
      optionId: "",
      unitId: "",
      pricingCategoryId: "",
      pricingMode: "per_unit",
      sellAmount: "",
      costAmount: "",
      minQuantity: "",
      maxQuantity: "",
      sortOrder: 0,
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && rule) {
      form.reset({
        optionPriceRuleId: rule.optionPriceRuleId,
        optionId: rule.optionId,
        unitId: rule.unitId,
        pricingCategoryId: rule.pricingCategoryId ?? "",
        pricingMode: rule.pricingMode,
        sellAmount: rule.sellAmountCents != null ? rule.sellAmountCents / 100 : "",
        costAmount: rule.costAmountCents != null ? rule.costAmountCents / 100 : "",
        minQuantity: rule.minQuantity ?? "",
        maxQuantity: rule.maxQuantity ?? "",
        sortOrder: rule.sortOrder,
        active: rule.active,
        notes: rule.notes ?? "",
      })
    } else if (open) {
      form.reset({
        optionPriceRuleId: "",
        optionId: "",
        unitId: "",
        pricingCategoryId: "",
        pricingMode: "per_unit",
        sellAmount: "",
        costAmount: "",
        minQuantity: "",
        maxQuantity: "",
        sortOrder: 0,
        active: true,
        notes: "",
      })
    }
  }, [open, rule, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      optionPriceRuleId: values.optionPriceRuleId,
      optionId: values.optionId,
      unitId: values.unitId,
      pricingCategoryId: values.pricingCategoryId || null,
      pricingMode: values.pricingMode,
      sellAmountCents: toCents(values.sellAmount),
      costAmountCents: toCents(values.costAmount),
      minQuantity: toInt(values.minQuantity),
      maxQuantity: toInt(values.maxQuantity),
      sortOrder: values.sortOrder,
      active: values.active,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/pricing/option-unit-price-rules/${rule.id}`, payload)
    } else {
      await api.post("/v1/pricing/option-unit-price-rules", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Option Unit Price Rule" : "Add Option Unit Price Rule"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>Option price rule ID</Label>
              <Input
                {...form.register("optionPriceRuleId")}
                placeholder="opr_…"
                disabled={isEditing}
              />
              {form.formState.errors.optionPriceRuleId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.optionPriceRuleId.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Option ID</Label>
                <Input {...form.register("optionId")} placeholder="popt_…" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Unit ID</Label>
                <Input {...form.register("unitId")} placeholder="punit_…" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Pricing category (optional)</Label>
                <select
                  {...form.register("pricingCategoryId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.code ? ` (${c.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Sell amount ($)</Label>
                <Input {...form.register("sellAmount")} type="number" step="0.01" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Cost amount ($)</Label>
                <Input {...form.register("costAmount")} type="number" step="0.01" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Min quantity</Label>
                <Input {...form.register("minQuantity")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Max quantity</Label>
                <Input {...form.register("maxQuantity")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Sort order</Label>
                <Input {...form.register("sortOrder")} type="number" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(v) => form.setValue("active", v)}
              />
              <Label>Active</Label>
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
