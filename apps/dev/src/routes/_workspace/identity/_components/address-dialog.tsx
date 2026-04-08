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
import { CountryCombobox } from "@/components/ui/country-combobox"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const ADDRESS_LABELS = [
  "primary",
  "billing",
  "shipping",
  "mailing",
  "meeting",
  "service",
  "legal",
  "other",
] as const

type AddressLabel = (typeof ADDRESS_LABELS)[number]

const numOrEmpty = z.coerce.number().optional().or(z.literal("")).nullable()

const formSchema = z.object({
  label: z.enum(ADDRESS_LABELS),
  fullText: z.string().optional().nullable(),
  line1: z.string().optional().nullable(),
  line2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  latitude: numOrEmpty,
  longitude: numOrEmpty,
  timezone: z.string().optional().nullable(),
  isPrimary: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type AddressData = {
  id: string
  entityType: string
  entityId: string
  label: AddressLabel
  fullText: string | null
  line1: string | null
  line2: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
  isPrimary: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
  address?: AddressData
  onSuccess: () => void
}

export function AddressDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  address,
  onSuccess,
}: Props) {
  const isEditing = !!address

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "primary",
      fullText: "",
      line1: "",
      line2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      latitude: "",
      longitude: "",
      timezone: "",
      isPrimary: false,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && address) {
      form.reset({
        label: address.label,
        fullText: address.fullText ?? "",
        line1: address.line1 ?? "",
        line2: address.line2 ?? "",
        city: address.city ?? "",
        region: address.region ?? "",
        postalCode: address.postalCode ?? "",
        country: address.country ?? "",
        latitude: address.latitude ?? "",
        longitude: address.longitude ?? "",
        timezone: address.timezone ?? "",
        isPrimary: address.isPrimary,
        notes: address.notes ?? "",
      })
    } else if (open) {
      form.reset({
        label: "primary",
        fullText: "",
        line1: "",
        line2: "",
        city: "",
        region: "",
        postalCode: "",
        country: "",
        latitude: "",
        longitude: "",
        timezone: "",
        isPrimary: false,
        notes: "",
      })
    }
  }, [open, address, form])

  const onSubmit = async (values: FormOutput) => {
    const toNum = (v: number | string | null | undefined) => (typeof v === "number" ? v : null)
    const payload = {
      label: values.label,
      fullText: values.fullText || null,
      line1: values.line1 || null,
      line2: values.line2 || null,
      city: values.city || null,
      region: values.region || null,
      postalCode: values.postalCode || null,
      country: values.country || null,
      latitude: toNum(values.latitude),
      longitude: toNum(values.longitude),
      timezone: values.timezone || null,
      isPrimary: values.isPrimary,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/identity/addresses/${address.id}`, payload)
    } else {
      await api.post(
        `/v1/identity/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/addresses`,
        payload,
      )
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Address" : "Add Address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Label</Label>
                <Select
                  value={form.watch("label")}
                  onValueChange={(v) => form.setValue("label", v as AddressLabel)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_LABELS.map((l) => (
                      <SelectItem key={l} value={l} className="capitalize">
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 self-end pb-1">
                <Switch
                  checked={form.watch("isPrimary")}
                  onCheckedChange={(v) => form.setValue("isPrimary", v)}
                />
                <Label>Primary</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Line 1</Label>
                <Input {...form.register("line1")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Line 2</Label>
                <Input {...form.register("line2")} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>City</Label>
                <Input {...form.register("city")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Region</Label>
                <Input {...form.register("region")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Postal code</Label>
                <Input {...form.register("postalCode")} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Country</Label>
                <CountryCombobox
                  value={form.watch("country") ?? null}
                  onChange={(code) => form.setValue("country", code)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Timezone</Label>
                <Input {...form.register("timezone")} placeholder="Europe/Istanbul" />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Latitude</Label>
                <Input {...form.register("latitude")} type="number" step="any" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Longitude</Label>
                <Input {...form.register("longitude")} type="number" step="any" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Full text (fallback)</Label>
              <Textarea {...form.register("fullText")} rows={2} />
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
              {isEditing ? "Save Changes" : "Add Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
