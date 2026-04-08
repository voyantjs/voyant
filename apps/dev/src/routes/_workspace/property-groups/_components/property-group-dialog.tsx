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

const GROUP_TYPES = [
  "chain",
  "brand",
  "management_company",
  "collection",
  "portfolio",
  "cluster",
  "other",
] as const

const STATUSES = ["active", "inactive", "archived"] as const

type GroupType = (typeof GROUP_TYPES)[number]
type Status = (typeof STATUSES)[number]

const formSchema = z.object({
  groupType: z.enum(GROUP_TYPES),
  status: z.enum(STATUSES),
  parentGroupId: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().optional().nullable(),
  brandName: z.string().optional().nullable(),
  legalName: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type PropertyGroupData = {
  id: string
  parentGroupId: string | null
  groupType: GroupType
  status: Status
  name: string
  code: string | null
  brandName: string | null
  legalName: string | null
  website: string | null
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: PropertyGroupData
  onSuccess: () => void
}

export function PropertyGroupDialog({ open, onOpenChange, group, onSuccess }: Props) {
  const isEditing = !!group

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupType: "chain",
      status: "active",
      parentGroupId: "",
      name: "",
      code: "",
      brandName: "",
      legalName: "",
      website: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && group) {
      form.reset({
        groupType: group.groupType,
        status: group.status,
        parentGroupId: group.parentGroupId ?? "",
        name: group.name,
        code: group.code ?? "",
        brandName: group.brandName ?? "",
        legalName: group.legalName ?? "",
        website: group.website ?? "",
        notes: group.notes ?? "",
      })
    } else if (open) {
      form.reset({
        groupType: "chain",
        status: "active",
        parentGroupId: "",
        name: "",
        code: "",
        brandName: "",
        legalName: "",
        website: "",
        notes: "",
      })
    }
  }, [open, group, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      groupType: values.groupType,
      status: values.status,
      parentGroupId: values.parentGroupId || null,
      name: values.name,
      code: values.code || null,
      brandName: values.brandName || null,
      legalName: values.legalName || null,
      website: values.website || null,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/facilities/property-groups/${group.id}`, payload)
    } else {
      await api.post("/v1/facilities/property-groups", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Property Group" : "Add Property Group"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Hilton Worldwide" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="hilton" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Group type</Label>
                <Select
                  value={form.watch("groupType")}
                  onValueChange={(v) => form.setValue("groupType", v as GroupType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as Status)}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Brand name</Label>
                <Input {...form.register("brandName")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Legal name</Label>
                <Input {...form.register("legalName")} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Website</Label>
              <Input {...form.register("website")} placeholder="https://example.com" />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Parent group ID (optional)</Label>
              <Input {...form.register("parentGroupId")} />
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
              {isEditing ? "Save Changes" : "Add Property Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
