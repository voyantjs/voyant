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
type RoomTypeLite = { id: string; name: string }
type RoomUnitLite = { id: string; roomNumber: string | null; code: string | null }

const STATUSES = ["open", "in_progress", "resolved", "cancelled"] as const
type Status = (typeof STATUSES)[number]

const formSchema = z.object({
  roomTypeId: z.string().optional().nullable(),
  roomUnitId: z.string().optional().nullable(),
  startsOn: z.string().min(1, "Start date is required"),
  endsOn: z.string().min(1, "End date is required"),
  status: z.enum(STATUSES),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type MaintenanceBlockData = {
  id: string
  propertyId: string
  roomTypeId: string | null
  roomUnitId: string | null
  startsOn: string
  endsOn: string
  status: Status
  reason: string | null
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  block?: MaintenanceBlockData
  onSuccess: () => void
}

export function MaintenanceBlockDialog({
  open,
  onOpenChange,
  propertyId,
  block,
  onSuccess,
}: Props) {
  const isEditing = !!block

  const roomTypesQuery = useQuery({
    queryKey: ["hospitality", "mtc-block", "room-types-pick", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomTypeLite>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })
  const roomUnitsQuery = useQuery({
    queryKey: ["hospitality", "mtc-block", "room-units-pick", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomUnitLite>>(
        `/v1/hospitality/room-units?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })
  const roomTypes = roomTypesQuery.data?.data ?? []
  const roomUnits = roomUnitsQuery.data?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomTypeId: "",
      roomUnitId: "",
      startsOn: "",
      endsOn: "",
      status: "open",
      reason: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && block) {
      form.reset({
        roomTypeId: block.roomTypeId ?? "",
        roomUnitId: block.roomUnitId ?? "",
        startsOn: block.startsOn,
        endsOn: block.endsOn,
        status: block.status,
        reason: block.reason ?? "",
        notes: block.notes ?? "",
      })
    } else if (open) {
      form.reset({
        roomTypeId: "",
        roomUnitId: "",
        startsOn: "",
        endsOn: "",
        status: "open",
        reason: "",
        notes: "",
      })
    }
  }, [open, block, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      propertyId,
      roomTypeId: values.roomTypeId || null,
      roomUnitId: values.roomUnitId || null,
      startsOn: values.startsOn,
      endsOn: values.endsOn,
      status: values.status,
      reason: values.reason || null,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/hospitality/maintenance-blocks/${block.id}`, payload)
    } else {
      await api.post("/v1/hospitality/maintenance-blocks", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Maintenance Block" : "Add Maintenance Block"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Room type (optional)</Label>
                <select
                  {...form.register("roomTypeId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Room unit (optional)</Label>
                <select
                  {...form.register("roomUnitId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {roomUnits.map((ru) => (
                    <option key={ru.id} value={ru.id}>
                      {ru.roomNumber ?? ru.code ?? ru.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Starts on</Label>
                <Input {...form.register("startsOn")} type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Ends on</Label>
                <Input {...form.register("endsOn")} type="date" />
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
                <Label>Reason</Label>
                <Input {...form.register("reason")} placeholder="HVAC failure" />
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
              {isEditing ? "Save Changes" : "Add Block"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
