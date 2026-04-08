import { useQuery } from "@tanstack/react-query"
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

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type PropertyLite = { id: string; facilityId: string; brandName: string | null }
type FacilityLite = { id: string; name: string }

const ROLES = ["member", "flagship", "managed", "franchise", "other"] as const
type Role = (typeof ROLES)[number]

const formSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  membershipRole: z.enum(ROLES),
  isPrimary: z.boolean(),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type PropertyGroupMemberData = {
  id: string
  groupId: string
  propertyId: string
  membershipRole: Role
  isPrimary: boolean
  validFrom: string | null
  validTo: string | null
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  member?: PropertyGroupMemberData
  onSuccess: () => void
}

export function PropertyGroupMemberDialog({
  open,
  onOpenChange,
  groupId,
  member,
  onSuccess,
}: Props) {
  const isEditing = !!member

  const propertiesQuery = useQuery({
    queryKey: ["property-group-members", "properties-pick"],
    queryFn: () => api.get<ListResponse<PropertyLite>>("/v1/facilities/properties?limit=200"),
    enabled: open,
  })
  const facilitiesQuery = useQuery({
    queryKey: ["property-group-members", "facilities-pick"],
    queryFn: () => api.get<ListResponse<FacilityLite>>("/v1/facilities/facilities?limit=200"),
    enabled: open,
  })
  const properties = propertiesQuery.data?.data ?? []
  const facilities = facilitiesQuery.data?.data ?? []
  const facilityById = new Map(facilities.map((f) => [f.id, f]))

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      membershipRole: "member",
      isPrimary: false,
      validFrom: "",
      validTo: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && member) {
      form.reset({
        propertyId: member.propertyId,
        membershipRole: member.membershipRole,
        isPrimary: member.isPrimary,
        validFrom: member.validFrom ?? "",
        validTo: member.validTo ?? "",
        notes: member.notes ?? "",
      })
    } else if (open) {
      form.reset({
        propertyId: "",
        membershipRole: "member",
        isPrimary: false,
        validFrom: "",
        validTo: "",
        notes: "",
      })
    }
  }, [open, member, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      groupId,
      propertyId: values.propertyId,
      membershipRole: values.membershipRole,
      isPrimary: values.isPrimary,
      validFrom: values.validFrom || null,
      validTo: values.validTo || null,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/facilities/property-group-members/${member.id}`, payload)
    } else {
      await api.post("/v1/facilities/property-group-members", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Member" : "Add Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>Property</Label>
              <select
                {...form.register("propertyId")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                disabled={isEditing}
              >
                <option value="">Select a property…</option>
                {properties.map((p) => {
                  const facility = facilityById.get(p.facilityId)
                  return (
                    <option key={p.id} value={p.id}>
                      {facility?.name ?? p.facilityId}
                      {p.brandName ? ` · ${p.brandName}` : ""}
                    </option>
                  )
                })}
              </select>
              {form.formState.errors.propertyId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.propertyId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select
                  value={form.watch("membershipRole")}
                  onValueChange={(v) => form.setValue("membershipRole", v as Role)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={form.watch("isPrimary")}
                  onCheckedChange={(v) => form.setValue("isPrimary", v)}
                />
                <Label>Primary</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Valid from</Label>
                <Input {...form.register("validFrom")} type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Valid to</Label>
                <Input {...form.register("validTo")} type="date" />
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
              {isEditing ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
