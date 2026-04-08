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
  Switch,
  Textarea,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }
type RoomTypeLite = { id: string; name: string }

const intOrEmpty = z.coerce.number().int().optional().or(z.literal("")).nullable()

const formSchema = z.object({
  roomTypeId: z.string().min(1, "Room type is required"),
  date: z.string().min(1, "Date is required"),
  totalUnits: z.coerce.number().int().min(0),
  availableUnits: z.coerce.number().int().min(0),
  heldUnits: z.coerce.number().int().min(0),
  soldUnits: z.coerce.number().int().min(0),
  outOfOrderUnits: z.coerce.number().int().min(0),
  overbookLimit: intOrEmpty,
  stopSell: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type RoomInventoryData = {
  id: string
  propertyId: string
  roomTypeId: string
  date: string
  totalUnits: number
  availableUnits: number
  heldUnits: number
  soldUnits: number
  outOfOrderUnits: number
  overbookLimit: number | null
  stopSell: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  inventory?: RoomInventoryData
  onSuccess: () => void
}

export function RoomInventoryDialog({
  open,
  onOpenChange,
  propertyId,
  inventory,
  onSuccess,
}: Props) {
  const isEditing = !!inventory

  const roomTypesQuery = useQuery({
    queryKey: ["hospitality", "room-inventory", "room-types-pick", propertyId],
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
      date: "",
      totalUnits: 0,
      availableUnits: 0,
      heldUnits: 0,
      soldUnits: 0,
      outOfOrderUnits: 0,
      overbookLimit: "",
      stopSell: false,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && inventory) {
      form.reset({
        roomTypeId: inventory.roomTypeId,
        date: inventory.date,
        totalUnits: inventory.totalUnits,
        availableUnits: inventory.availableUnits,
        heldUnits: inventory.heldUnits,
        soldUnits: inventory.soldUnits,
        outOfOrderUnits: inventory.outOfOrderUnits,
        overbookLimit: inventory.overbookLimit ?? "",
        stopSell: inventory.stopSell,
        notes: inventory.notes ?? "",
      })
    } else if (open) {
      form.reset({
        roomTypeId: "",
        date: "",
        totalUnits: 0,
        availableUnits: 0,
        heldUnits: 0,
        soldUnits: 0,
        outOfOrderUnits: 0,
        overbookLimit: "",
        stopSell: false,
        notes: "",
      })
    }
  }, [open, inventory, form])

  const onSubmit = async (values: FormOutput) => {
    const toInt = (v: number | string | null | undefined) => (typeof v === "number" ? v : null)
    const payload = {
      propertyId,
      roomTypeId: values.roomTypeId,
      date: values.date,
      totalUnits: values.totalUnits,
      availableUnits: values.availableUnits,
      heldUnits: values.heldUnits,
      soldUnits: values.soldUnits,
      outOfOrderUnits: values.outOfOrderUnits,
      overbookLimit: toInt(values.overbookLimit),
      stopSell: values.stopSell,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/hospitality/room-inventory/${inventory.id}`, payload)
    } else {
      await api.post("/v1/hospitality/room-inventory", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Room Inventory" : "Add Room Inventory"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Room type</Label>
                <select
                  {...form.register("roomTypeId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={isEditing}
                >
                  <option value="">Select a room type…</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.roomTypeId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.roomTypeId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Date</Label>
                <Input {...form.register("date")} type="date" disabled={isEditing} />
                {form.formState.errors.date && (
                  <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Total</Label>
                <Input {...form.register("totalUnits")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Available</Label>
                <Input {...form.register("availableUnits")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Held</Label>
                <Input {...form.register("heldUnits")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Sold</Label>
                <Input {...form.register("soldUnits")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Out of order</Label>
                <Input {...form.register("outOfOrderUnits")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Overbook limit</Label>
                <Input {...form.register("overbookLimit")} type="number" min="0" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("stopSell")}
                onCheckedChange={(v) => form.setValue("stopSell", v)}
              />
              <Label>Stop sell</Label>
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
              {isEditing ? "Save Changes" : "Add Inventory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
