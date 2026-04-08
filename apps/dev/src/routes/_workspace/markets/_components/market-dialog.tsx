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
} from "@/components/ui"
import { CountryCombobox } from "@/components/ui/country-combobox"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const MARKET_STATUSES = ["active", "inactive", "archived"] as const

type MarketStatus = (typeof MARKET_STATUSES)[number]

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(255),
  status: z.enum(MARKET_STATUSES),
  regionCode: z.string().optional().nullable(),
  countryCode: z.string().optional().nullable(),
  defaultLanguageTag: z.string().min(2).max(35),
  defaultCurrency: z.string().length(3, "Currency must be 3 chars"),
  timezone: z.string().optional().nullable(),
  taxContext: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type MarketData = {
  id: string
  code: string
  name: string
  status: MarketStatus
  regionCode: string | null
  countryCode: string | null
  defaultLanguageTag: string
  defaultCurrency: string
  timezone: string | null
  taxContext: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  market?: MarketData
  onSuccess: () => void
}

export function MarketDialog({ open, onOpenChange, market, onSuccess }: Props) {
  const isEditing = !!market

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      status: "active",
      regionCode: "",
      countryCode: "",
      defaultLanguageTag: "en",
      defaultCurrency: "EUR",
      timezone: "",
      taxContext: "",
    },
  })

  useEffect(() => {
    if (open && market) {
      form.reset({
        code: market.code,
        name: market.name,
        status: market.status,
        regionCode: market.regionCode ?? "",
        countryCode: market.countryCode ?? "",
        defaultLanguageTag: market.defaultLanguageTag,
        defaultCurrency: market.defaultCurrency,
        timezone: market.timezone ?? "",
        taxContext: market.taxContext ?? "",
      })
    } else if (open) {
      form.reset({
        code: "",
        name: "",
        status: "active",
        regionCode: "",
        countryCode: "",
        defaultLanguageTag: "en",
        defaultCurrency: "EUR",
        timezone: "",
        taxContext: "",
      })
    }
  }, [open, market, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      code: values.code,
      name: values.name,
      status: values.status,
      regionCode: values.regionCode || null,
      countryCode: values.countryCode ? values.countryCode.toUpperCase() : null,
      defaultLanguageTag: values.defaultLanguageTag,
      defaultCurrency: values.defaultCurrency.toUpperCase(),
      timezone: values.timezone || null,
      taxContext: values.taxContext || null,
    }
    if (isEditing) {
      await api.patch(`/v1/markets/markets/${market.id}`, payload)
    } else {
      await api.post("/v1/markets/markets", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Market" : "Add Market"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="EU-DE" />
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Germany" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as MarketStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Region code</Label>
                <Input {...form.register("regionCode")} placeholder="EU, APAC…" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Country</Label>
                <CountryCombobox
                  value={form.watch("countryCode") ?? null}
                  onChange={(code) => form.setValue("countryCode", code)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Language tag</Label>
                <Input {...form.register("defaultLanguageTag")} placeholder="en, de-DE…" />
                {form.formState.errors.defaultLanguageTag && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.defaultLanguageTag.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Default currency</Label>
                <Input {...form.register("defaultCurrency")} placeholder="EUR" maxLength={3} />
                {form.formState.errors.defaultCurrency && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.defaultCurrency.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Timezone</Label>
                <Input {...form.register("timezone")} placeholder="Europe/Berlin" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tax context</Label>
              <Input {...form.register("taxContext")} placeholder="EU-VAT, US-Sales-Tax…" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Market"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
