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

const policyFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().max(100).optional().nullable(),
  policyType: z.enum(["simple", "advanced", "non_refundable", "custom"]),
  simpleCutoffHours: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  isDefault: z.boolean(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type PolicyFormValues = z.input<typeof policyFormSchema>
type PolicyFormOutput = z.output<typeof policyFormSchema>

export type CancellationPolicyData = {
  id: string
  name: string
  code: string | null
  policyType: "simple" | "advanced" | "non_refundable" | "custom"
  simpleCutoffHours: number | null
  isDefault: boolean
  active: boolean
  notes: string | null
}

type CancellationPolicyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy?: CancellationPolicyData
  onSuccess: () => void
}

const POLICY_TYPES = [
  { value: "simple", label: "Simple" },
  { value: "advanced", label: "Advanced" },
  { value: "non_refundable", label: "Non-refundable" },
  { value: "custom", label: "Custom" },
] as const

export function CancellationPolicyDialog({
  open,
  onOpenChange,
  policy,
  onSuccess,
}: CancellationPolicyDialogProps) {
  const isEditing = !!policy

  const form = useForm<PolicyFormValues, unknown, PolicyFormOutput>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      name: "",
      code: "",
      policyType: "custom",
      simpleCutoffHours: "",
      isDefault: false,
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && policy) {
      form.reset({
        name: policy.name,
        code: policy.code ?? "",
        policyType: policy.policyType,
        simpleCutoffHours: policy.simpleCutoffHours ?? "",
        isDefault: policy.isDefault,
        active: policy.active,
        notes: policy.notes ?? "",
      })
    } else if (open) {
      form.reset()
    }
  }, [open, policy, form])

  const onSubmit = async (values: PolicyFormOutput) => {
    const payload = {
      name: values.name,
      code: values.code || null,
      policyType: values.policyType,
      simpleCutoffHours:
        typeof values.simpleCutoffHours === "number" ? values.simpleCutoffHours : null,
      isDefault: values.isDefault,
      active: values.active,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/pricing/cancellation-policies/${policy.id}`, payload)
    } else {
      await api.post("/v1/pricing/cancellation-policies", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Cancellation Policy" : "New Cancellation Policy"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Standard 48h policy" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="standard-48h" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={form.watch("policyType")}
                  onValueChange={(v) =>
                    form.setValue("policyType", v as PolicyFormValues["policyType"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.watch("policyType") === "simple" && (
                <div className="flex flex-col gap-2">
                  <Label>Simple cutoff (hours)</Label>
                  <Input {...form.register("simpleCutoffHours")} type="number" min="0" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isDefault")}
                  onCheckedChange={(v) => form.setValue("isDefault", v)}
                />
                <Label>Default</Label>
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
              <Textarea {...form.register("notes")} placeholder="Internal description…" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
