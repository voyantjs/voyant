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
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const contactFormSchema = z.object({
  type: z.enum(["individual", "company"]),
  relation: z.enum(["client", "partner", "supplier", "other"]),
  companyName: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  preferredLanguage: z.string().optional().nullable(),
  preferredCurrency: z.string().optional().nullable(),
})

type ContactFormValues = z.input<typeof contactFormSchema>
type ContactFormOutput = z.output<typeof contactFormSchema>

type Contact = {
  id: string
  type: "individual" | "company"
  relation: "client" | "partner" | "supplier" | "other"
  companyName: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
  preferredLanguage: string | null
  preferredCurrency: string | null
  tags: string[]
}

type ContactDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact
  onSuccess: () => void
}

export function ContactDialog({ open, onOpenChange, contact, onSuccess }: ContactDialogProps) {
  const isEditing = !!contact

  const form = useForm<ContactFormValues, unknown, ContactFormOutput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      type: "individual",
      relation: "client",
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      country: "",
      preferredLanguage: "",
      preferredCurrency: "",
    },
  })

  useEffect(() => {
    if (open && contact) {
      form.reset({
        type: contact.type,
        relation: contact.relation,
        companyName: contact.companyName ?? "",
        firstName: contact.firstName ?? "",
        lastName: contact.lastName ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        website: contact.website ?? "",
        address: contact.address ?? "",
        city: contact.city ?? "",
        country: contact.country ?? "",
        preferredLanguage: contact.preferredLanguage ?? "",
        preferredCurrency: contact.preferredCurrency ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [open, contact, form])

  const contactType = form.watch("type")

  const onSubmit = async (values: ContactFormOutput) => {
    const payload = {
      ...values,
      email: values.email || null,
      website: values.website || null,
      companyName: values.companyName || null,
      firstName: values.firstName || null,
      lastName: values.lastName || null,
      phone: values.phone || null,
      address: values.address || null,
      city: values.city || null,
      country: values.country || null,
      preferredLanguage: values.preferredLanguage || null,
      preferredCurrency: values.preferredCurrency || null,
    }

    if (isEditing) {
      await api.patch(`/v1/contacts/${contact.id}`, payload)
    } else {
      await api.post("/v1/contacts", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contact" : "New Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={contactType}
                  onValueChange={(v) => form.setValue("type", v as "individual" | "company")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Relation</Label>
                <Select
                  value={form.watch("relation")}
                  onValueChange={(v) =>
                    form.setValue("relation", v as "client" | "partner" | "supplier" | "other")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {contactType === "company" ? (
              <div className="flex flex-col gap-2">
                <Label>Company Name</Label>
                <Input {...form.register("companyName")} placeholder="Acme Travel Co." />
                {form.formState.errors.companyName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.companyName.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>First Name</Label>
                  <Input {...form.register("firstName")} placeholder="John" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Last Name</Label>
                  <Input {...form.register("lastName")} placeholder="Doe" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input {...form.register("email")} type="email" placeholder="john@example.com" />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Phone</Label>
                <Input {...form.register("phone")} placeholder="+1 234 567 890" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Website</Label>
              <Input {...form.register("website")} placeholder="https://example.com" />
              {form.formState.errors.website && (
                <p className="text-xs text-destructive">{form.formState.errors.website.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Address</Label>
                <Input {...form.register("address")} placeholder="123 Main St" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>City</Label>
                <Input {...form.register("city")} placeholder="New York" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Country</Label>
              <Input {...form.register("country")} placeholder="US" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
