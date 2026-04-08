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

const CONTACT_POINT_KINDS = [
  "email",
  "phone",
  "mobile",
  "whatsapp",
  "website",
  "sms",
  "fax",
  "social",
  "other",
] as const

type ContactPointKind = (typeof CONTACT_POINT_KINDS)[number]

const formSchema = z.object({
  kind: z.enum(CONTACT_POINT_KINDS),
  label: z.string().optional().nullable(),
  value: z.string().min(1, "Value is required").max(500),
  isPrimary: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type ContactPointData = {
  id: string
  entityType: string
  entityId: string
  kind: ContactPointKind
  label: string | null
  value: string
  isPrimary: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
  contactPoint?: ContactPointData
  onSuccess: () => void
}

export function ContactPointDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  contactPoint,
  onSuccess,
}: Props) {
  const isEditing = !!contactPoint

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kind: "email",
      label: "",
      value: "",
      isPrimary: false,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && contactPoint) {
      form.reset({
        kind: contactPoint.kind,
        label: contactPoint.label ?? "",
        value: contactPoint.value,
        isPrimary: contactPoint.isPrimary,
        notes: contactPoint.notes ?? "",
      })
    } else if (open) {
      form.reset({
        kind: "email",
        label: "",
        value: "",
        isPrimary: false,
        notes: "",
      })
    }
  }, [open, contactPoint, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      kind: values.kind,
      label: values.label || null,
      value: values.value,
      isPrimary: values.isPrimary,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/identity/contact-points/${contactPoint.id}`, payload)
    } else {
      await api.post(
        `/v1/identity/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/contact-points`,
        payload,
      )
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contact Point" : "Add Contact Point"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Kind</Label>
                <Select
                  value={form.watch("kind")}
                  onValueChange={(v) => form.setValue("kind", v as ContactPointKind)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_POINT_KINDS.map((k) => (
                      <SelectItem key={k} value={k} className="capitalize">
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Label (optional)</Label>
                <Input {...form.register("label")} placeholder="work, personal…" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Value</Label>
              <Input {...form.register("value")} placeholder="name@example.com" />
              {form.formState.errors.value && (
                <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("isPrimary")}
                onCheckedChange={(v) => form.setValue("isPrimary", v)}
              />
              <Label>Primary</Label>
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
              {isEditing ? "Save Changes" : "Add Contact Point"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
