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
type RatePlanLite = { id: string; name: string }
type MealPlanLite = { id: string; name: string }

const STATUSES = ["reserved", "checked_in", "checked_out", "cancelled", "no_show"] as const
type Status = (typeof STATUSES)[number]

const formSchema = z.object({
  bookingItemId: z.string().min(1, "Booking item ID is required"),
  roomTypeId: z.string().min(1, "Room type is required"),
  roomUnitId: z.string().optional().nullable(),
  ratePlanId: z.string().min(1, "Rate plan is required"),
  mealPlanId: z.string().optional().nullable(),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  nightCount: z.coerce.number().int().min(1),
  roomCount: z.coerce.number().int().min(1),
  adults: z.coerce.number().int().min(0),
  children: z.coerce.number().int().min(0),
  infants: z.coerce.number().int().min(0),
  confirmationCode: z.string().optional().nullable(),
  voucherCode: z.string().optional().nullable(),
  status: z.enum(STATUSES),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type StayBookingItemData = {
  id: string
  bookingItemId: string
  propertyId: string
  roomTypeId: string
  roomUnitId: string | null
  ratePlanId: string
  mealPlanId: string | null
  checkInDate: string
  checkOutDate: string
  nightCount: number
  roomCount: number
  adults: number
  children: number
  infants: number
  confirmationCode: string | null
  voucherCode: string | null
  status: Status
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  item?: StayBookingItemData
  onSuccess: () => void
}

export function StayBookingItemDialog({ open, onOpenChange, propertyId, item, onSuccess }: Props) {
  const isEditing = !!item

  const roomTypesQuery = useQuery({
    queryKey: ["hospitality", "sbi", "rt", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomTypeLite>>(
        `/v1/hospitality/room-types?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })
  const roomUnitsQuery = useQuery({
    queryKey: ["hospitality", "sbi", "ru", propertyId],
    queryFn: () =>
      api.get<ListResponse<RoomUnitLite>>(
        `/v1/hospitality/room-units?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })
  const ratePlansQuery = useQuery({
    queryKey: ["hospitality", "sbi", "rp", propertyId],
    queryFn: () =>
      api.get<ListResponse<RatePlanLite>>(
        `/v1/hospitality/rate-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })
  const mealPlansQuery = useQuery({
    queryKey: ["hospitality", "sbi", "mp", propertyId],
    queryFn: () =>
      api.get<ListResponse<MealPlanLite>>(
        `/v1/hospitality/meal-plans?propertyId=${propertyId}&limit=200`,
      ),
    enabled: open && !!propertyId,
  })
  const roomTypes = roomTypesQuery.data?.data ?? []
  const roomUnits = roomUnitsQuery.data?.data ?? []
  const ratePlans = ratePlansQuery.data?.data ?? []
  const mealPlans = mealPlansQuery.data?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookingItemId: "",
      roomTypeId: "",
      roomUnitId: "",
      ratePlanId: "",
      mealPlanId: "",
      checkInDate: "",
      checkOutDate: "",
      nightCount: 1,
      roomCount: 1,
      adults: 1,
      children: 0,
      infants: 0,
      confirmationCode: "",
      voucherCode: "",
      status: "reserved",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && item) {
      form.reset({
        bookingItemId: item.bookingItemId,
        roomTypeId: item.roomTypeId,
        roomUnitId: item.roomUnitId ?? "",
        ratePlanId: item.ratePlanId,
        mealPlanId: item.mealPlanId ?? "",
        checkInDate: item.checkInDate,
        checkOutDate: item.checkOutDate,
        nightCount: item.nightCount,
        roomCount: item.roomCount,
        adults: item.adults,
        children: item.children,
        infants: item.infants,
        confirmationCode: item.confirmationCode ?? "",
        voucherCode: item.voucherCode ?? "",
        status: item.status,
        notes: item.notes ?? "",
      })
    } else if (open) {
      form.reset({
        bookingItemId: "",
        roomTypeId: "",
        roomUnitId: "",
        ratePlanId: "",
        mealPlanId: "",
        checkInDate: "",
        checkOutDate: "",
        nightCount: 1,
        roomCount: 1,
        adults: 1,
        children: 0,
        infants: 0,
        confirmationCode: "",
        voucherCode: "",
        status: "reserved",
        notes: "",
      })
    }
  }, [open, item, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      bookingItemId: values.bookingItemId,
      propertyId,
      roomTypeId: values.roomTypeId,
      roomUnitId: values.roomUnitId || null,
      ratePlanId: values.ratePlanId,
      mealPlanId: values.mealPlanId || null,
      checkInDate: values.checkInDate,
      checkOutDate: values.checkOutDate,
      nightCount: values.nightCount,
      roomCount: values.roomCount,
      adults: values.adults,
      children: values.children,
      infants: values.infants,
      confirmationCode: values.confirmationCode || null,
      voucherCode: values.voucherCode || null,
      status: values.status,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/hospitality/stay-booking-items/${item.id}`, payload)
    } else {
      await api.post("/v1/hospitality/stay-booking-items", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Stay Booking Item" : "Add Stay Booking Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>Booking item ID</Label>
              <Input
                {...form.register("bookingItemId")}
                placeholder="bkit_…"
                disabled={isEditing}
              />
              {form.formState.errors.bookingItemId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.bookingItemId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Room type</Label>
                <select
                  {...form.register("roomTypeId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select…</option>
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
                <Label>Rate plan</Label>
                <select
                  {...form.register("ratePlanId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select…</option>
                  {ratePlans.map((rp) => (
                    <option key={rp.id} value={rp.id}>
                      {rp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Meal plan (optional)</Label>
                <select
                  {...form.register("mealPlanId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {mealPlans.map((mp) => (
                    <option key={mp.id} value={mp.id}>
                      {mp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Check-in</Label>
                <Input {...form.register("checkInDate")} type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Check-out</Label>
                <Input {...form.register("checkOutDate")} type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Nights</Label>
                <Input {...form.register("nightCount")} type="number" min="1" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Rooms</Label>
                <Input {...form.register("roomCount")} type="number" min="1" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Adults</Label>
                <Input {...form.register("adults")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Children</Label>
                <Input {...form.register("children")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Infants</Label>
                <Input {...form.register("infants")} type="number" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
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
                <Label>Confirmation</Label>
                <Input {...form.register("confirmationCode")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Voucher</Label>
                <Input {...form.register("voucherCode")} />
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
              {isEditing ? "Save Changes" : "Add Stay"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
