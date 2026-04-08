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
import { CountryCombobox } from "@/components/ui/country-combobox"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const KINDS = [
  "property",
  "hotel",
  "resort",
  "venue",
  "meeting_point",
  "transfer_hub",
  "airport",
  "station",
  "marina",
  "camp",
  "lodge",
  "office",
  "attraction",
  "restaurant",
  "other",
] as const

const STATUSES = ["active", "inactive", "archived"] as const

type FacilityKind = (typeof KINDS)[number]
type FacilityStatus = (typeof STATUSES)[number]

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().max(100).optional().nullable(),
  kind: z.enum(KINDS),
  status: z.enum(STATUSES),
  description: z.string().optional().nullable(),
  timezone: z.string().max(100).optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type FacilityData = {
  id: string
  name: string
  code: string | null
  kind: FacilityKind
  status: FacilityStatus
  description: string | null
  timezone: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  region: string | null
  country: string | null
  postalCode: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  facility?: FacilityData
  onSuccess: () => void
}

export function FacilityDialog({ open, onOpenChange, facility, onSuccess }: Props) {
  const isEditing = !!facility

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      kind: "hotel",
      status: "active",
      description: "",
      timezone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      region: "",
      country: "",
      postalCode: "",
    },
  })

  useEffect(() => {
    if (open && facility) {
      form.reset({
        name: facility.name,
        code: facility.code ?? "",
        kind: facility.kind,
        status: facility.status,
        description: facility.description ?? "",
        timezone: facility.timezone ?? "",
        addressLine1: facility.addressLine1 ?? "",
        addressLine2: facility.addressLine2 ?? "",
        city: facility.city ?? "",
        region: facility.region ?? "",
        country: facility.country ?? "",
        postalCode: facility.postalCode ?? "",
      })
    } else if (open) {
      form.reset({
        name: "",
        code: "",
        kind: "hotel",
        status: "active",
        description: "",
        timezone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        region: "",
        country: "",
        postalCode: "",
      })
    }
  }, [open, facility, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      name: values.name,
      code: values.code || null,
      kind: values.kind,
      status: values.status,
      description: values.description || null,
      timezone: values.timezone || null,
      addressLine1: values.addressLine1 || null,
      addressLine2: values.addressLine2 || null,
      city: values.city || null,
      region: values.region || null,
      country: values.country || null,
      postalCode: values.postalCode || null,
    }
    if (isEditing) {
      await api.patch(`/v1/facilities/facilities/${facility.id}`, payload)
    } else {
      await api.post("/v1/facilities/facilities", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Facility" : "Add Facility"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Grand Hotel Istanbul" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="grand-istanbul" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Kind</Label>
                <Select
                  value={form.watch("kind")}
                  onValueChange={(v) => form.setValue("kind", v as FacilityKind)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k} value={k} className="capitalize">
                        {k.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as FacilityStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea
                {...form.register("description")}
                placeholder="Short description for this facility…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Timezone</Label>
                <Input {...form.register("timezone")} placeholder="Europe/Istanbul" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Address line 1</Label>
              <Input {...form.register("addressLine1")} placeholder="Sultanahmet Square 1" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Address line 2</Label>
              <Input {...form.register("addressLine2")} />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <Label>City</Label>
                <Input {...form.register("city")} placeholder="Istanbul" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Region</Label>
                <Input {...form.register("region")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Country</Label>
                <CountryCombobox
                  value={form.watch("country") ?? null}
                  onChange={(code) => form.setValue("country", code)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Postal code</Label>
                <Input {...form.register("postalCode")} />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Facility"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
