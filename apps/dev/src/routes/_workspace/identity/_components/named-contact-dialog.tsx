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

const NAMED_CONTACT_ROLES = [
  "general",
  "primary",
  "reservations",
  "operations",
  "front_desk",
  "sales",
  "emergency",
  "accounting",
  "legal",
  "other",
] as const

type NamedContactRole = (typeof NAMED_CONTACT_ROLES)[number]

const formSchema = z.object({
  role: z.enum(NAMED_CONTACT_ROLES),
  name: z.string().min(1, "Name is required").max(255),
  title: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isPrimary: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type NamedContactData = {
  id: string
  entityType: string
  entityId: string
  role: NamedContactRole
  name: string
  title: string | null
  email: string | null
  phone: string | null
  isPrimary: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
  namedContact?: NamedContactData
  onSuccess: () => void
}

export function NamedContactDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  namedContact,
  onSuccess,
}: Props) {
  const isEditing = !!namedContact

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "general",
      name: "",
      title: "",
      email: "",
      phone: "",
      isPrimary: false,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && namedContact) {
      form.reset({
        role: namedContact.role,
        name: namedContact.name,
        title: namedContact.title ?? "",
        email: namedContact.email ?? "",
        phone: namedContact.phone ?? "",
        isPrimary: namedContact.isPrimary,
        notes: namedContact.notes ?? "",
      })
    } else if (open) {
      form.reset({
        role: "general",
        name: "",
        title: "",
        email: "",
        phone: "",
        isPrimary: false,
        notes: "",
      })
    }
  }, [open, namedContact, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      role: values.role,
      name: values.name,
      title: values.title || null,
      email: values.email || null,
      phone: values.phone || null,
      isPrimary: values.isPrimary,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/identity/named-contacts/${namedContact.id}`, payload)
    } else {
      await api.post(
        `/v1/identity/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/named-contacts`,
        payload,
      )
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Named Contact" : "Add Named Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select
                  value={form.watch("role")}
                  onValueChange={(v) => form.setValue("role", v as NamedContactRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NAMED_CONTACT_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">
                        {r.replace(/_/g, " ")}
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
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Jane Doe" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input {...form.register("title")} placeholder="Director of Sales" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input {...form.register("email")} placeholder="jane@example.com" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Phone</Label>
                <Input {...form.register("phone")} />
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
              {isEditing ? "Save Changes" : "Add Named Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
