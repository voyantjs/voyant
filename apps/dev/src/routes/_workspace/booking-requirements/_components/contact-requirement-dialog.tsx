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

const CONTACT_FIELDS = [
  { value: "first_name", label: "First name" },
  { value: "last_name", label: "Last name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date_of_birth", label: "Date of birth" },
  { value: "nationality", label: "Nationality" },
  { value: "passport_number", label: "Passport number" },
  { value: "passport_expiry", label: "Passport expiry" },
  { value: "dietary_requirements", label: "Dietary requirements" },
  { value: "accessibility_needs", label: "Accessibility needs" },
  { value: "special_requests", label: "Special requests" },
  { value: "address", label: "Address" },
  { value: "other", label: "Other" },
] as const

const SCOPES = [
  { value: "booking", label: "Booking" },
  { value: "lead_traveler", label: "Lead traveler" },
  { value: "participant", label: "Participant" },
  { value: "booker", label: "Booker" },
] as const

type FieldKey = (typeof CONTACT_FIELDS)[number]["value"]
type Scope = (typeof SCOPES)[number]["value"]

const formSchema = z.object({
  fieldKey: z.enum([
    "first_name",
    "last_name",
    "email",
    "phone",
    "date_of_birth",
    "nationality",
    "passport_number",
    "passport_expiry",
    "dietary_requirements",
    "accessibility_needs",
    "special_requests",
    "address",
    "other",
  ]),
  scope: z.enum(["booking", "lead_traveler", "participant", "booker"]),
  isRequired: z.boolean(),
  perParticipant: z.boolean(),
  active: z.boolean(),
  sortOrder: z.coerce.number().int(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type ContactRequirementData = {
  id: string
  productId: string
  optionId: string | null
  fieldKey: FieldKey
  scope: Scope
  isRequired: boolean
  perParticipant: boolean
  active: boolean
  sortOrder: number
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  requirement?: ContactRequirementData
  nextSortOrder?: number
  onSuccess: () => void
}

export function ContactRequirementDialog({
  open,
  onOpenChange,
  productId,
  requirement,
  nextSortOrder,
  onSuccess,
}: Props) {
  const isEditing = !!requirement

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fieldKey: "first_name",
      scope: "participant",
      isRequired: true,
      perParticipant: false,
      active: true,
      sortOrder: 0,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && requirement) {
      form.reset({
        fieldKey: requirement.fieldKey,
        scope: requirement.scope,
        isRequired: requirement.isRequired,
        perParticipant: requirement.perParticipant,
        active: requirement.active,
        sortOrder: requirement.sortOrder,
        notes: requirement.notes ?? "",
      })
    } else if (open) {
      form.reset({
        fieldKey: "first_name",
        scope: "participant",
        isRequired: true,
        perParticipant: false,
        active: true,
        sortOrder: nextSortOrder ?? 0,
        notes: "",
      })
    }
  }, [open, requirement, nextSortOrder, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      productId,
      fieldKey: values.fieldKey,
      scope: values.scope,
      isRequired: values.isRequired,
      perParticipant: values.perParticipant,
      active: values.active,
      sortOrder: values.sortOrder,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/booking-requirements/contact-requirements/${requirement.id}`, payload)
    } else {
      await api.post("/v1/booking-requirements/contact-requirements", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Requirement" : "Add Requirement"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Field</Label>
                <Select
                  value={form.watch("fieldKey")}
                  onValueChange={(v) => form.setValue("fieldKey", v as FieldKey)}
                  disabled={isEditing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Scope</Label>
                <Select
                  value={form.watch("scope")}
                  onValueChange={(v) => form.setValue("scope", v as Scope)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isRequired")}
                  onCheckedChange={(v) => form.setValue("isRequired", v)}
                />
                <Label>Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("perParticipant")}
                  onCheckedChange={(v) => form.setValue("perParticipant", v)}
                />
                <Label>Per participant</Label>
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
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Requirement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
