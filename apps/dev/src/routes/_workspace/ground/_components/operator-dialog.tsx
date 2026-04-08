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
  Switch,
  Textarea,
} from "@/components/ui"
import { EntityCombobox } from "@/components/ui/entity-combobox"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type SupplierRef = { id: string; name: string; code?: string | null }
type FacilityRef = { id: string; name: string; code?: string | null; city?: string | null }

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().max(100).optional().nullable(),
  supplierId: z.string().optional().nullable(),
  facilityId: z.string().optional().nullable(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type OperatorData = {
  id: string
  name: string
  code: string | null
  supplierId: string | null
  facilityId: string | null
  active: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  operator?: OperatorData
  onSuccess: () => void
}

export function OperatorDialog({ open, onOpenChange, operator, onSuccess }: Props) {
  const isEditing = !!operator

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      supplierId: "",
      facilityId: "",
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && operator) {
      form.reset({
        name: operator.name,
        code: operator.code ?? "",
        supplierId: operator.supplierId ?? "",
        facilityId: operator.facilityId ?? "",
        active: operator.active,
        notes: operator.notes ?? "",
      })
    } else if (open) {
      form.reset({
        name: "",
        code: "",
        supplierId: "",
        facilityId: "",
        active: true,
        notes: "",
      })
    }
  }, [open, operator, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      name: values.name,
      code: values.code || null,
      supplierId: values.supplierId || null,
      facilityId: values.facilityId || null,
      active: values.active,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/ground/operators/${operator.id}`, payload)
    } else {
      await api.post("/v1/ground/operators", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Operator" : "Add Operator"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Istanbul Transfer Co." />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="istanbul-transfer" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Supplier (optional)</Label>
              <EntityCombobox<SupplierRef>
                value={form.watch("supplierId") ?? null}
                onChange={(id) => form.setValue("supplierId", id)}
                endpoint="/v1/suppliers?limit=200"
                queryKey={["suppliers", "picker"]}
                getLabel={(s) => s.name}
                getSecondary={(s) => s.code ?? undefined}
                placeholder="Search suppliers…"
                emptyText="No suppliers found."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Facility (optional)</Label>
              <EntityCombobox<FacilityRef>
                value={form.watch("facilityId") ?? null}
                onChange={(id) => form.setValue("facilityId", id)}
                endpoint="/v1/facilities/facilities?limit=200"
                queryKey={["facilities", "picker"]}
                getLabel={(f) => f.name}
                getSecondary={(f) => [f.code, f.city].filter(Boolean).join(" · ") || undefined}
                placeholder="Search facilities…"
                emptyText="No facilities found."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(v) => form.setValue("active", v)}
              />
              <Label>Active</Label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Operator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
