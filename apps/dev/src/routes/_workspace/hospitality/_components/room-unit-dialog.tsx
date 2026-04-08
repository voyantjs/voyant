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
  Textarea,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type RoomTypeLite = { id: string; name: string; code: string | null }

const STATUSES = ["active", "inactive", "out_of_order", "archived"] as const
type Status = (typeof STATUSES)[number]

const formSchema = z.object({
  roomTypeId: z.string().min(1, "Room type is required"),
  code: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  wing: z.string().optional().nullable(),
  status: z.enum(STATUSES),
  viewCode: z.string().optional().nullable(),
  accessibilityCode: z.string().optional().nullable(),
  genderRestriction: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type RoomUnitData = {
  id: string
  propertyId: string
  roomTypeId: string
  code: string | null
  roomNumber: string | null
  floor: string | null
  wing: string | null
  status: Status
  viewCode: string | null
  accessibilityCode: string | null
  genderRestriction: string | null
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  unit?: RoomUnitData
  onSuccess: () => void
}

export function RoomUnitDialog({ open, onOpenChange, propertyId, unit, onSuccess }: Props) {
  const isEditing = !!unit

  const roomTypesQuery = useQuery({
    queryKey: ["hospitality", "room-units", "room-types-pick", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomTypeLite>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })
  const roomTypes = roomTypesQuery.data?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomTypeId: "",
      code: "",
      roomNumber: "",
      floor: "",
      wing: "",
      status: "active",
      viewCode: "",
      accessibilityCode: "",
      genderRestriction: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && unit) {
      form.reset({
        roomTypeId: unit.roomTypeId,
        code: unit.code ?? "",
        roomNumber: unit.roomNumber ?? "",
        floor: unit.floor ?? "",
        wing: unit.wing ?? "",
        status: unit.status,
        viewCode: unit.viewCode ?? "",
        accessibilityCode: unit.accessibilityCode ?? "",
        genderRestriction: unit.genderRestriction ?? "",
        notes: unit.notes ?? "",
      })
    } else if (open) {
      form.reset({
        roomTypeId: "",
        code: "",
        roomNumber: "",
        floor: "",
        wing: "",
        status: "active",
        viewCode: "",
        accessibilityCode: "",
        genderRestriction: "",
        notes: "",
      })
    }
  }, [open, unit, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      propertyId,
      roomTypeId: values.roomTypeId,
      code: values.code || null,
      roomNumber: values.roomNumber || null,
      floor: values.floor || null,
      wing: values.wing || null,
      status: values.status,
      viewCode: values.viewCode || null,
      accessibilityCode: values.accessibilityCode || null,
      genderRestriction: values.genderRestriction || null,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/hospitality/room-units/${unit.id}`, payload)
    } else {
      await api.post("/v1/hospitality/room-units", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Room Unit" : "Add Room Unit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>Room type</Label>
              <select
                {...form.register("roomTypeId")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select a room type…</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                    {rt.code ? ` · ${rt.code}` : ""}
                  </option>
                ))}
              </select>
              {form.formState.errors.roomTypeId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.roomTypeId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Room number</Label>
                <Input {...form.register("roomNumber")} placeholder="412" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="DLX-412" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Floor</Label>
                <Input {...form.register("floor")} placeholder="4" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Wing</Label>
                <Input {...form.register("wing")} placeholder="North" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>View code</Label>
                <Input {...form.register("viewCode")} placeholder="sea" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Accessibility</Label>
                <Input {...form.register("accessibilityCode")} placeholder="wheelchair" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Gender restriction</Label>
                <Input {...form.register("genderRestriction")} placeholder="female_only" />
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
              {isEditing ? "Save Changes" : "Add Room Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
