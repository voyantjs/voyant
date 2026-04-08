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

const contractFormSchema = z.object({
  scope: z.enum(["customer", "supplier", "partner", "channel", "other"]),
  title: z.string().min(1, "Title is required"),
  language: z.string().min(2).max(10).optional(),
  templateVersionId: z.string().optional(),
  seriesId: z.string().optional(),
  personId: z.string().optional(),
  organizationId: z.string().optional(),
  supplierId: z.string().optional(),
  channelId: z.string().optional(),
  expiresAt: z.string().optional(),
  variables: z.string().optional(),
  metadata: z.string().optional(),
})

type FormValues = z.input<typeof contractFormSchema>
type FormOutput = z.output<typeof contractFormSchema>

type ContractData = {
  id: string
  scope: "customer" | "supplier" | "partner" | "channel" | "other"
  title: string
  language: string | null
  templateVersionId: string | null
  seriesId: string | null
  personId: string | null
  organizationId: string | null
  supplierId: string | null
  channelId: string | null
  expiresAt: string | null
  variables: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

type ContractDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract?: ContractData
  onSuccess: () => void
}

const SCOPES = [
  { value: "customer", label: "Customer" },
  { value: "supplier", label: "Supplier" },
  { value: "partner", label: "Partner" },
  { value: "channel", label: "Channel" },
  { value: "other", label: "Other" },
] as const

export function ContractDialog({ open, onOpenChange, contract, onSuccess }: ContractDialogProps) {
  const isEditing = !!contract

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      scope: "customer",
      title: "",
      language: "en",
      templateVersionId: "",
      seriesId: "",
      personId: "",
      organizationId: "",
      supplierId: "",
      channelId: "",
      expiresAt: "",
      variables: "",
      metadata: "",
    },
  })

  useEffect(() => {
    if (open && contract) {
      form.reset({
        scope: contract.scope,
        title: contract.title,
        language: contract.language ?? "en",
        templateVersionId: contract.templateVersionId ?? "",
        seriesId: contract.seriesId ?? "",
        personId: contract.personId ?? "",
        organizationId: contract.organizationId ?? "",
        supplierId: contract.supplierId ?? "",
        channelId: contract.channelId ?? "",
        expiresAt: contract.expiresAt ?? "",
        variables: contract.variables ? JSON.stringify(contract.variables, null, 2) : "",
        metadata: contract.metadata ? JSON.stringify(contract.metadata, null, 2) : "",
      })
    } else if (open) {
      form.reset()
    }
  }, [open, contract, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      scope: values.scope,
      title: values.title,
      language: values.language || "en",
      templateVersionId: values.templateVersionId || undefined,
      seriesId: values.seriesId || undefined,
      personId: values.personId || undefined,
      organizationId: values.organizationId || undefined,
      supplierId: values.supplierId || undefined,
      channelId: values.channelId || undefined,
      expiresAt: values.expiresAt || undefined,
      variables: values.variables ? JSON.parse(values.variables) : undefined,
      metadata: values.metadata ? JSON.parse(values.metadata) : undefined,
    }

    if (isEditing) {
      await api.patch(`/v1/admin/legal/contracts/${contract.id}`, payload)
    } else {
      await api.post("/v1/admin/legal/contracts", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contract" : "New Contract"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Scope</Label>
                <Select
                  value={form.watch("scope")}
                  onValueChange={(v) => form.setValue("scope", v as FormValues["scope"])}
                >
                  <SelectTrigger>
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
              <div className="flex flex-col gap-2">
                <Label>Language</Label>
                <Input {...form.register("language")} placeholder="en" maxLength={10} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input {...form.register("title")} placeholder="Contract title" />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Template Version ID</Label>
                <Input {...form.register("templateVersionId")} placeholder="Optional" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Series ID</Label>
                <Input {...form.register("seriesId")} placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Person ID</Label>
                <Input {...form.register("personId")} placeholder="Optional" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Organization ID</Label>
                <Input {...form.register("organizationId")} placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Supplier ID</Label>
                <Input {...form.register("supplierId")} placeholder="Optional" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Channel ID</Label>
                <Input {...form.register("channelId")} placeholder="Optional" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Expires At</Label>
              <Input {...form.register("expiresAt")} type="datetime-local" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Variables (JSON)</Label>
              <Textarea {...form.register("variables")} placeholder='{"key": "value"}' rows={3} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Metadata (JSON)</Label>
              <Textarea {...form.register("metadata")} placeholder='{"key": "value"}' rows={3} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Contract"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
