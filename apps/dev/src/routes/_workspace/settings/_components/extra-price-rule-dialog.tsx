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

const ADDON_PRICING_MODES = [
  "included",
  "per_person",
  "per_booking",
  "on_request",
  "unavailable",
] as const
type AddonPricingMode = (typeof ADDON_PRICING_MODES)[number]

const formSchema = z.object({
  optionPriceRuleId: z.string().min(1, "Option price rule is required"),
  optionId: z.string().min(1, "Option ID is required"),
  productExtraId: z.string().optional().nullable(),
  optionExtraConfigId: z.string().optional().nullable(),
  pricingMode: z.enum(ADDON_PRICING_MODES),
  sellAmount: z.coerce.number().min(0).optional().or(z.literal("")).nullable(),
  costAmount: z.coerce.number().min(0).optional().or(z.literal("")).nullable(),
  active: z.boolean(),
  sortOrder: z.coerce.number().int(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type ExtraPriceRuleData = {
  id: string
  optionPriceRuleId: string
  optionId: string
  productExtraId: string | null
  optionExtraConfigId: string | null
  pricingMode: AddonPricingMode
  sellAmountCents: number | null
  costAmountCents: number | null
  active: boolean
  sortOrder: number
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: ExtraPriceRuleData
  onSuccess: () => void
}

const toCents = (v: number | "" | null | undefined): number | null =>
  typeof v === "number" ? Math.round(v * 100) : null

export function ExtraPriceRuleDialog({ open, onOpenChange, rule, onSuccess }: Props) {
  const isEditing = !!rule

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      optionPriceRuleId: "",
      optionId: "",
      productExtraId: "",
      optionExtraConfigId: "",
      pricingMode: "included",
      sellAmount: "",
      costAmount: "",
      active: true,
      sortOrder: 0,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && rule) {
      form.reset({
        optionPriceRuleId: rule.optionPriceRuleId,
        optionId: rule.optionId,
        productExtraId: rule.productExtraId ?? "",
        optionExtraConfigId: rule.optionExtraConfigId ?? "",
        pricingMode: rule.pricingMode,
        sellAmount: rule.sellAmountCents != null ? rule.sellAmountCents / 100 : "",
        costAmount: rule.costAmountCents != null ? rule.costAmountCents / 100 : "",
        active: rule.active,
        sortOrder: rule.sortOrder,
        notes: rule.notes ?? "",
      })
    } else if (open) {
      form.reset({
        optionPriceRuleId: "",
        optionId: "",
        productExtraId: "",
        optionExtraConfigId: "",
        pricingMode: "included",
        sellAmount: "",
        costAmount: "",
        active: true,
        sortOrder: 0,
        notes: "",
      })
    }
  }, [open, rule, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      optionPriceRuleId: values.optionPriceRuleId,
      optionId: values.optionId,
      productExtraId: values.productExtraId || null,
      optionExtraConfigId: values.optionExtraConfigId || null,
      pricingMode: values.pricingMode,
      sellAmountCents: toCents(values.sellAmount),
      costAmountCents: toCents(values.costAmount),
      active: values.active,
      sortOrder: values.sortOrder,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/pricing/extra-price-rules/${rule.id}`, payload)
    } else {
      await api.post("/v1/pricing/extra-price-rules", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Extra Price Rule" : "Add Extra Price Rule"}</DialogTitle>
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
                {form.formState.errors.optionId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.optionId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Product extra ID (optional)</Label>
                <Input {...form.register("productExtraId")} placeholder="pext_…" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Option extra config ID (optional)</Label>
              <Input {...form.register("optionExtraConfigId")} placeholder="oecf_…" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Pricing mode</Label>
              <Select
                value={form.watch("pricingMode")}
                onValueChange={(v) => form.setValue("pricingMode", v as AddonPricingMode)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADDON_PRICING_MODES.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">
                      {m.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Sort order</Label>
                <Input {...form.register("sortOrder")} type="number" />
              </div>
              <div className="flex items-center gap-3 pt-6">
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
              {isEditing ? "Save Changes" : "Add Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
