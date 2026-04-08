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

const rateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  currency: z.string().min(3).max(3, "Use 3-letter ISO code"),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
  unit: z.enum(["per_person", "per_group", "per_night", "per_vehicle", "flat"]),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
  minPax: z.coerce.number().int().positive().optional().or(z.literal("")).nullable(),
  maxPax: z.coerce.number().int().positive().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
})

type RateFormValues = z.input<typeof rateFormSchema>
type RateFormOutput = z.output<typeof rateFormSchema>

type RateData = {
  id: string
  name: string
  currency: string
  amountCents: number
  unit: "per_person" | "per_group" | "per_night" | "per_vehicle" | "flat"
  validFrom: string | null
  validTo: string | null
  minPax: number | null
  maxPax: number | null
  notes: string | null
}

type RateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId: string
  serviceId: string
  rate?: RateData
  onSuccess: () => void
}

const RATE_UNITS = [
  { value: "per_person", label: "Per Person" },
  { value: "per_group", label: "Per Group" },
  { value: "per_night", label: "Per Night" },
  { value: "per_vehicle", label: "Per Vehicle" },
  { value: "flat", label: "Flat" },
] as const

export function RateDialog({
  open,
  onOpenChange,
  supplierId,
  serviceId,
  rate,
  onSuccess,
}: RateDialogProps) {
  const isEditing = !!rate

  const form = useForm<RateFormValues, unknown, RateFormOutput>({
    resolver: zodResolver(rateFormSchema),
    defaultValues: {
      name: "",
      currency: "EUR",
      amount: 0,
      unit: "per_person",
      validFrom: "",
      validTo: "",
      minPax: "",
      maxPax: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && rate) {
      form.reset({
        name: rate.name,
        currency: rate.currency,
        amount: rate.amountCents / 100,
        unit: rate.unit,
        validFrom: rate.validFrom ?? "",
        validTo: rate.validTo ?? "",
        minPax: rate.minPax ?? "",
        maxPax: rate.maxPax ?? "",
        notes: rate.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [open, rate, form])

  const onSubmit = async (values: RateFormOutput) => {
    const payload = {
      name: values.name,
      currency: values.currency,
      amountCents: Math.round(values.amount * 100),
      unit: values.unit,
      validFrom: values.validFrom || null,
      validTo: values.validTo || null,
      minPax: values.minPax && typeof values.minPax === "number" ? values.minPax : null,
      maxPax: values.maxPax && typeof values.maxPax === "number" ? values.maxPax : null,
      notes: values.notes || null,
    }

    if (isEditing) {
      await api.patch(`/v1/suppliers/${supplierId}/services/${serviceId}/rates/${rate.id}`, payload)
    } else {
      await api.post(`/v1/suppliers/${supplierId}/services/${serviceId}/rates`, payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rate" : "Add Rate"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>Name / Season</Label>
              <Input {...form.register("name")} placeholder="Summer 2025" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Input
                  {...form.register("currency")}
                  placeholder="EUR"
                  maxLength={3}
                  className="uppercase"
                />
                {form.formState.errors.currency && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.currency.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Amount</Label>
                <Input
                  {...form.register("amount")}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="150.00"
                />
                {form.formState.errors.amount && (
                  <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Unit</Label>
                <Select
                  value={form.watch("unit")}
                  onValueChange={(v) => form.setValue("unit", v as RateFormValues["unit"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RATE_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Valid From</Label>
                <Input {...form.register("validFrom")} type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Valid To</Label>
                <Input {...form.register("validTo")} type="date" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Min Pax</Label>
                <Input {...form.register("minPax")} type="number" min="1" placeholder="1" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Max Pax</Label>
                <Input {...form.register("maxPax")} type="number" min="1" placeholder="50" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Additional pricing notes..." />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Rate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
