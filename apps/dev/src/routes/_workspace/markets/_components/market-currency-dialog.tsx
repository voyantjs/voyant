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
  Switch,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const formSchema = z.object({
  currencyCode: z.string().length(3, "Currency must be 3 chars"),
  isDefault: z.boolean(),
  isSettlement: z.boolean(),
  isReporting: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type MarketCurrencyData = {
  id: string
  marketId: string
  currencyCode: string
  isDefault: boolean
  isSettlement: boolean
  isReporting: boolean
  sortOrder: number
  active: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  marketId: string
  currency?: MarketCurrencyData
  onSuccess: () => void
}

export function MarketCurrencyDialog({ open, onOpenChange, marketId, currency, onSuccess }: Props) {
  const isEditing = !!currency

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currencyCode: "EUR",
      isDefault: false,
      isSettlement: false,
      isReporting: false,
      sortOrder: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (open && currency) {
      form.reset({
        currencyCode: currency.currencyCode,
        isDefault: currency.isDefault,
        isSettlement: currency.isSettlement,
        isReporting: currency.isReporting,
        sortOrder: currency.sortOrder,
        active: currency.active,
      })
    } else if (open) {
      form.reset({
        currencyCode: "EUR",
        isDefault: false,
        isSettlement: false,
        isReporting: false,
        sortOrder: 0,
        active: true,
      })
    }
  }, [open, currency, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      currencyCode: values.currencyCode.toUpperCase(),
      isDefault: values.isDefault,
      isSettlement: values.isSettlement,
      isReporting: values.isReporting,
      sortOrder: values.sortOrder,
      active: values.active,
    }
    if (isEditing) {
      await api.patch(`/v1/markets/market-currencies/${currency.id}`, payload)
    } else {
      await api.post(`/v1/markets/markets/${marketId}/currencies`, payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Currency" : "Add Currency"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Currency code</Label>
                <Input {...form.register("currencyCode")} placeholder="EUR" maxLength={3} />
                {form.formState.errors.currencyCode && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.currencyCode.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Sort order</Label>
                <Input {...form.register("sortOrder")} type="number" min="0" />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isDefault")}
                  onCheckedChange={(v) => form.setValue("isDefault", v)}
                />
                <Label>Default</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isSettlement")}
                  onCheckedChange={(v) => form.setValue("isSettlement", v)}
                />
                <Label>Settlement</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isReporting")}
                  onCheckedChange={(v) => form.setValue("isReporting", v)}
                />
                <Label>Reporting</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                />
                <Label>Active</Label>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Currency"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
