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
import { EntityCombobox } from "@/components/ui/entity-combobox"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

type ResourceRef = { id: string; name: string; kind?: string | null }
type OperatorRef = { id: string; name: string; code?: string | null }

const CATEGORIES = [
  "car",
  "sedan",
  "suv",
  "van",
  "minibus",
  "bus",
  "boat",
  "train",
  "other",
] as const
const CLASSES = ["economy", "standard", "premium", "luxury", "accessible", "other"] as const

type VehicleCategory = (typeof CATEGORIES)[number]
type VehicleClass = (typeof CLASSES)[number]

const formSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
  operatorId: z.string().optional().nullable(),
  category: z.enum(CATEGORIES),
  vehicleClass: z.enum(CLASSES),
  passengerCapacity: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  checkedBagCapacity: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  carryOnCapacity: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  wheelchairCapacity: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  childSeatCapacity: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  isAccessible: z.boolean(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type VehicleData = {
  id: string
  resourceId: string
  operatorId: string | null
  category: VehicleCategory
  vehicleClass: VehicleClass
  passengerCapacity: number | null
  checkedBagCapacity: number | null
  carryOnCapacity: number | null
  wheelchairCapacity: number | null
  childSeatCapacity: number | null
  isAccessible: boolean
  active: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: VehicleData
  onSuccess: () => void
}

export function VehicleDialog({ open, onOpenChange, vehicle, onSuccess }: Props) {
  const isEditing = !!vehicle

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resourceId: "",
      operatorId: "",
      category: "other",
      vehicleClass: "standard",
      passengerCapacity: "",
      checkedBagCapacity: "",
      carryOnCapacity: "",
      wheelchairCapacity: "",
      childSeatCapacity: "",
      isAccessible: false,
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && vehicle) {
      form.reset({
        resourceId: vehicle.resourceId,
        operatorId: vehicle.operatorId ?? "",
        category: vehicle.category,
        vehicleClass: vehicle.vehicleClass,
        passengerCapacity: vehicle.passengerCapacity ?? "",
        checkedBagCapacity: vehicle.checkedBagCapacity ?? "",
        carryOnCapacity: vehicle.carryOnCapacity ?? "",
        wheelchairCapacity: vehicle.wheelchairCapacity ?? "",
        childSeatCapacity: vehicle.childSeatCapacity ?? "",
        isAccessible: vehicle.isAccessible,
        active: vehicle.active,
        notes: vehicle.notes ?? "",
      })
    } else if (open) {
      form.reset({
        resourceId: "",
        operatorId: "",
        category: "other",
        vehicleClass: "standard",
        passengerCapacity: "",
        checkedBagCapacity: "",
        carryOnCapacity: "",
        wheelchairCapacity: "",
        childSeatCapacity: "",
        isAccessible: false,
        active: true,
        notes: "",
      })
    }
  }, [open, vehicle, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      resourceId: values.resourceId,
      operatorId: values.operatorId || null,
      category: values.category,
      vehicleClass: values.vehicleClass,
      passengerCapacity:
        typeof values.passengerCapacity === "number" ? values.passengerCapacity : null,
      checkedBagCapacity:
        typeof values.checkedBagCapacity === "number" ? values.checkedBagCapacity : null,
      carryOnCapacity: typeof values.carryOnCapacity === "number" ? values.carryOnCapacity : null,
      wheelchairCapacity:
        typeof values.wheelchairCapacity === "number" ? values.wheelchairCapacity : null,
      childSeatCapacity:
        typeof values.childSeatCapacity === "number" ? values.childSeatCapacity : null,
      isAccessible: values.isAccessible,
      active: values.active,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/ground/vehicles/${vehicle.id}`, payload)
    } else {
      await api.post("/v1/ground/vehicles", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Resource</Label>
                <EntityCombobox<ResourceRef>
                  value={form.watch("resourceId") || null}
                  onChange={(id) => form.setValue("resourceId", id ?? "")}
                  endpoint="/v1/resources/resources?limit=200"
                  queryKey={["resources", "picker"]}
                  getLabel={(r) => r.name}
                  getSecondary={(r) => r.kind ?? undefined}
                  placeholder="Search resources…"
                  emptyText="No resources found."
                />
                {form.formState.errors.resourceId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.resourceId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Operator (optional)</Label>
                <EntityCombobox<OperatorRef>
                  value={form.watch("operatorId") ?? null}
                  onChange={(id) => form.setValue("operatorId", id)}
                  endpoint="/v1/ground/operators?limit=200"
                  queryKey={["ground", "operators", "picker"]}
                  getLabel={(o) => o.name}
                  getSecondary={(o) => o.code ?? undefined}
                  placeholder="Search operators…"
                  emptyText="No operators found."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(v) => form.setValue("category", v as VehicleCategory)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Class</Label>
                <Select
                  value={form.watch("vehicleClass")}
                  onValueChange={(v) => form.setValue("vehicleClass", v as VehicleClass)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Passengers</Label>
                <Input {...form.register("passengerCapacity")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Checked bags</Label>
                <Input {...form.register("checkedBagCapacity")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Carry-on</Label>
                <Input {...form.register("carryOnCapacity")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Wheelchairs</Label>
                <Input {...form.register("wheelchairCapacity")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Child seats</Label>
                <Input {...form.register("childSeatCapacity")} type="number" min="0" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("isAccessible")}
                  onCheckedChange={(v) => form.setValue("isAccessible", v)}
                />
                <Label>Accessible</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                />
                <Label>Active</Label>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
