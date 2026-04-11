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
import {
  CONTACT_FIELDS,
  CONTACT_SCOPES,
  type ContactRequirementData,
} from "./booking-requirements-shared"

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
type FieldKey = FormOutput["fieldKey"]
type Scope = FormOutput["scope"]

export interface ContactRequirementDialogProps {
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
}: ContactRequirementDialogProps) {
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
  }, [form, nextSortOrder, open, requirement])

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
                  onValueChange={(value) => form.setValue("fieldKey", value as FieldKey)}
                  disabled={isEditing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_FIELDS.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Scope</Label>
                <Select
                  value={form.watch("scope")}
                  onValueChange={(value) => form.setValue("scope", value as Scope)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_SCOPES.map((scope) => (
                      <SelectItem key={scope.value} value={scope.value}>
                        {scope.label}
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
                  onCheckedChange={(value) => form.setValue("isRequired", value)}
                />
                <Label>Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("perParticipant")}
                  onCheckedChange={(value) => form.setValue("perParticipant", value)}
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
                  onCheckedChange={(value) => form.setValue("active", value)}
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
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEditing ? "Save Changes" : "Add Requirement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
