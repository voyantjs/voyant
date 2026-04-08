import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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
import type { OptionUnitData } from "./unit-dialog"

type CategoryOption = { id: string; name: string; code: string | null; categoryType: string }

const cellFormSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  pricingCategoryId: z.string().optional().nullable(),
  pricingMode: z.enum(["per_unit", "per_person", "per_booking", "included", "free", "on_request"]),
  sell: z.coerce.number().min(0),
  cost: z.coerce.number().min(0),
  minQuantity: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  maxQuantity: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type CellFormValues = z.input<typeof cellFormSchema>
type CellFormOutput = z.output<typeof cellFormSchema>

export type OptionUnitPriceRuleData = {
  id: string
  optionPriceRuleId: string
  optionId: string
  unitId: string
  pricingCategoryId: string | null
  pricingMode: "per_unit" | "per_person" | "per_booking" | "included" | "free" | "on_request"
  sellAmountCents: number
  costAmountCents: number
  minQuantity: number | null
  maxQuantity: number | null
  sortOrder: number
  active: boolean
  notes: string | null
}

type UnitPriceRuleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  optionPriceRuleId: string
  optionId: string
  units: OptionUnitData[]
  preselectedUnitId?: string
  preselectedCategoryId?: string | null
  cell?: OptionUnitPriceRuleData
  onSuccess: () => void
}

const UNIT_PRICING_MODES = [
  { value: "per_unit", label: "Per Unit" },
  { value: "per_person", label: "Per Person" },
  { value: "per_booking", label: "Per Booking" },
  { value: "included", label: "Included" },
  { value: "free", label: "Free" },
  { value: "on_request", label: "On Request" },
] as const

export function UnitPriceRuleDialog({
  open,
  onOpenChange,
  optionPriceRuleId,
  optionId,
  units,
  preselectedUnitId,
  preselectedCategoryId,
  cell,
  onSuccess,
}: UnitPriceRuleDialogProps) {
  const isEditing = !!cell
  const [categories, setCategories] = useState<CategoryOption[]>([])

  const form = useForm<CellFormValues, unknown, CellFormOutput>({
    resolver: zodResolver(cellFormSchema),
    defaultValues: {
      unitId: "",
      pricingCategoryId: "",
      pricingMode: "per_person",
      sell: 0,
      cost: 0,
      minQuantity: "",
      maxQuantity: "",
      sortOrder: 0,
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (!open) return
    void api
      .get<{ data: CategoryOption[] }>("/v1/pricing/pricing-categories?limit=200")
      .then((res) => setCategories(res.data ?? []))
  }, [open])

  useEffect(() => {
    if (open && cell) {
      form.reset({
        unitId: cell.unitId,
        pricingCategoryId: cell.pricingCategoryId ?? "",
        pricingMode: cell.pricingMode,
        sell: cell.sellAmountCents / 100,
        cost: cell.costAmountCents / 100,
        minQuantity: cell.minQuantity ?? "",
        maxQuantity: cell.maxQuantity ?? "",
        sortOrder: cell.sortOrder,
        active: cell.active,
        notes: cell.notes ?? "",
      })
    } else if (open) {
      form.reset({
        unitId: preselectedUnitId ?? "",
        pricingCategoryId: preselectedCategoryId ?? "",
        pricingMode: "per_person",
        sell: 0,
        cost: 0,
        minQuantity: "",
        maxQuantity: "",
        sortOrder: 0,
        active: true,
        notes: "",
      })
    }
  }, [open, cell, preselectedUnitId, preselectedCategoryId, form])

  const onSubmit = async (values: CellFormOutput) => {
    const payload = {
      optionPriceRuleId,
      optionId,
      unitId: values.unitId,
      pricingCategoryId: values.pricingCategoryId || null,
      pricingMode: values.pricingMode,
      sellAmountCents: Math.round(values.sell * 100),
      costAmountCents: Math.round(values.cost * 100),
      minQuantity: typeof values.minQuantity === "number" ? values.minQuantity : null,
      maxQuantity: typeof values.maxQuantity === "number" ? values.maxQuantity : null,
      sortOrder: values.sortOrder,
      active: values.active,
      notes: values.notes || null,
    }

    if (isEditing) {
      await api.patch(`/v1/pricing/option-unit-price-rules/${cell.id}`, payload)
    } else {
      await api.post("/v1/pricing/option-unit-price-rules", payload)
    }
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Price" : "Set Price"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <SheetBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Unit</Label>
                <Select
                  value={form.watch("unitId") || undefined}
                  onValueChange={(v) => form.setValue("unitId", v ?? "", { shouldValidate: true })}
                  items={units.map((u) => ({ value: u.id, label: `${u.name} (${u.unitType})` }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.unitType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.unitId && (
                  <p className="text-xs text-destructive">{form.formState.errors.unitId.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select
                  value={form.watch("pricingCategoryId") ?? "none"}
                  onValueChange={(v) => form.setValue("pricingCategoryId", v === "none" ? null : v)}
                  items={[{ value: "none", label: "None (applies to all)" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None (applies to all)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (applies to all)</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Pricing mode</Label>
              <Select
                value={form.watch("pricingMode")}
                onValueChange={(v) =>
                  form.setValue("pricingMode", v as CellFormValues["pricingMode"])
                }
                items={UNIT_PRICING_MODES}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_PRICING_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Sell</Label>
                <Input {...form.register("sell")} type="number" step="0.01" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Cost</Label>
                <Input {...form.register("cost")} type="number" step="0.01" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Min quantity</Label>
                <Input {...form.register("minQuantity")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Max quantity</Label>
                <Input {...form.register("maxQuantity")} type="number" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Sort order</Label>
                <Input {...form.register("sortOrder")} type="number" />
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
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Set Price"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
