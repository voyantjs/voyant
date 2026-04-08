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
  Textarea,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const ruleFormSchema = z.object({
  sortOrder: z.coerce.number().int(),
  cutoffMinutesBefore: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  chargeType: z.enum(["none", "amount", "percentage"]),
  chargeAmount: z.coerce.number().min(0).optional().or(z.literal("")).nullable(),
  chargePercent: z.coerce.number().min(0).max(100).optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
})

type RuleFormValues = z.input<typeof ruleFormSchema>
type RuleFormOutput = z.output<typeof ruleFormSchema>

export type CancellationPolicyRuleData = {
  id: string
  cancellationPolicyId: string
  sortOrder: number
  cutoffMinutesBefore: number | null
  chargeType: "none" | "amount" | "percentage"
  chargeAmountCents: number | null
  chargePercentBasisPoints: number | null
  notes: string | null
}

type CancellationPolicyRuleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  policyId: string
  rule?: CancellationPolicyRuleData
  nextSortOrder?: number
  onSuccess: () => void
}

const CHARGE_TYPES = [
  { value: "none", label: "None" },
  { value: "amount", label: "Amount" },
  { value: "percentage", label: "Percentage" },
] as const

export function CancellationPolicyRuleDialog({
  open,
  onOpenChange,
  policyId,
  rule,
  nextSortOrder,
  onSuccess,
}: CancellationPolicyRuleDialogProps) {
  const isEditing = !!rule

  const form = useForm<RuleFormValues, unknown, RuleFormOutput>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      sortOrder: 0,
      cutoffMinutesBefore: "",
      chargeType: "percentage",
      chargeAmount: "",
      chargePercent: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && rule) {
      form.reset({
        sortOrder: rule.sortOrder,
        cutoffMinutesBefore: rule.cutoffMinutesBefore ?? "",
        chargeType: rule.chargeType,
        chargeAmount: rule.chargeAmountCents != null ? rule.chargeAmountCents / 100 : "",
        chargePercent:
          rule.chargePercentBasisPoints != null ? rule.chargePercentBasisPoints / 100 : "",
        notes: rule.notes ?? "",
      })
    } else if (open) {
      form.reset({
        sortOrder: nextSortOrder ?? 0,
        cutoffMinutesBefore: "",
        chargeType: "percentage",
        chargeAmount: "",
        chargePercent: "",
        notes: "",
      })
    }
  }, [open, rule, nextSortOrder, form])

  const chargeType = form.watch("chargeType")

  const onSubmit = async (values: RuleFormOutput) => {
    const payload = {
      cancellationPolicyId: policyId,
      sortOrder: values.sortOrder,
      cutoffMinutesBefore:
        typeof values.cutoffMinutesBefore === "number" ? values.cutoffMinutesBefore : null,
      chargeType: values.chargeType,
      chargeAmountCents:
        values.chargeType === "amount" && typeof values.chargeAmount === "number"
          ? Math.round(values.chargeAmount * 100)
          : null,
      chargePercentBasisPoints:
        values.chargeType === "percentage" && typeof values.chargePercent === "number"
          ? Math.round(values.chargePercent * 100)
          : null,
      notes: values.notes || null,
    }

    if (isEditing) {
      await api.patch(`/v1/pricing/cancellation-policy-rules/${rule.id}`, payload)
    } else {
      await api.post("/v1/pricing/cancellation-policy-rules", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rule" : "Add Rule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Cutoff (minutes before)</Label>
                <Input
                  {...form.register("cutoffMinutesBefore")}
                  type="number"
                  min="0"
                  placeholder="2880"
                />
                <p className="text-xs text-muted-foreground">48h = 2880m · 24h = 1440m</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Sort order</Label>
                <Input {...form.register("sortOrder")} type="number" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Charge type</Label>
              <Select
                value={form.watch("chargeType")}
                onValueChange={(v) =>
                  form.setValue("chargeType", v as RuleFormValues["chargeType"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHARGE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {chargeType === "amount" && (
              <div className="flex flex-col gap-2">
                <Label>Charge amount</Label>
                <Input {...form.register("chargeAmount")} type="number" step="0.01" min="0" />
              </div>
            )}

            {chargeType === "percentage" && (
              <div className="flex flex-col gap-2">
                <Label>Charge percent (0-100)</Label>
                <Input
                  {...form.register("chargePercent")}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="50"
                />
              </div>
            )}

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
