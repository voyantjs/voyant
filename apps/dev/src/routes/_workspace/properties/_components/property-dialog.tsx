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
type FacilityLite = { id: string; name: string }

const PROPERTY_TYPES = [
  "hotel",
  "resort",
  "villa",
  "apartment",
  "hostel",
  "lodge",
  "camp",
  "other",
] as const

type PropertyType = (typeof PROPERTY_TYPES)[number]

const intOrEmpty = z.coerce.number().int().optional().or(z.literal("")).nullable()

const formSchema = z.object({
  facilityId: z.string().min(1, "Facility is required"),
  propertyType: z.enum(PROPERTY_TYPES),
  brandName: z.string().optional().nullable(),
  groupName: z.string().optional().nullable(),
  rating: intOrEmpty,
  ratingScale: intOrEmpty,
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  policyNotes: z.string().optional().nullable(),
  amenityNotes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type PropertyData = {
  id: string
  facilityId: string
  propertyType: PropertyType
  brandName: string | null
  groupName: string | null
  rating: number | null
  ratingScale: number | null
  checkInTime: string | null
  checkOutTime: string | null
  policyNotes: string | null
  amenityNotes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: PropertyData
  onSuccess: () => void
}

export function PropertyDialog({ open, onOpenChange, property, onSuccess }: Props) {
  const isEditing = !!property

  const facilitiesQuery = useQuery({
    queryKey: ["properties", "facilities-pick"],
    queryFn: () =>
      api.get<ListResponse<FacilityLite>>("/v1/facilities/facilities?limit=200&kind=property"),
    enabled: open && !isEditing,
  })
  const facilities = facilitiesQuery.data?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      facilityId: "",
      propertyType: "hotel",
      brandName: "",
      groupName: "",
      rating: "",
      ratingScale: "",
      checkInTime: "",
      checkOutTime: "",
      policyNotes: "",
      amenityNotes: "",
    },
  })

  useEffect(() => {
    if (open && property) {
      form.reset({
        facilityId: property.facilityId,
        propertyType: property.propertyType,
        brandName: property.brandName ?? "",
        groupName: property.groupName ?? "",
        rating: property.rating ?? "",
        ratingScale: property.ratingScale ?? "",
        checkInTime: property.checkInTime ?? "",
        checkOutTime: property.checkOutTime ?? "",
        policyNotes: property.policyNotes ?? "",
        amenityNotes: property.amenityNotes ?? "",
      })
    } else if (open) {
      form.reset({
        facilityId: "",
        propertyType: "hotel",
        brandName: "",
        groupName: "",
        rating: "",
        ratingScale: "",
        checkInTime: "",
        checkOutTime: "",
        policyNotes: "",
        amenityNotes: "",
      })
    }
  }, [open, property, form])

  const onSubmit = async (values: FormOutput) => {
    const toInt = (v: number | string | null | undefined) => (typeof v === "number" ? v : null)
    const payload = {
      facilityId: values.facilityId,
      propertyType: values.propertyType,
      brandName: values.brandName || null,
      groupName: values.groupName || null,
      rating: toInt(values.rating),
      ratingScale: toInt(values.ratingScale),
      checkInTime: values.checkInTime || null,
      checkOutTime: values.checkOutTime || null,
      policyNotes: values.policyNotes || null,
      amenityNotes: values.amenityNotes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/facilities/properties/${property.id}`, payload)
    } else {
      await api.post("/v1/facilities/properties", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Property" : "Add Property"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            {!isEditing && (
              <div className="flex flex-col gap-2">
                <Label>Facility</Label>
                <select
                  {...form.register("facilityId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select a facility…</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.facilityId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.facilityId.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Property type</Label>
                <Select
                  value={form.watch("propertyType")}
                  onValueChange={(v) => form.setValue("propertyType", v as PropertyType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Brand name</Label>
                <Input {...form.register("brandName")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Group name</Label>
                <Input {...form.register("groupName")} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Rating</Label>
                <Input {...form.register("rating")} type="number" min="0" max="10" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Rating scale</Label>
                <Input {...form.register("ratingScale")} type="number" min="1" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Check-in</Label>
                <Input {...form.register("checkInTime")} placeholder="14:00" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Check-out</Label>
                <Input {...form.register("checkOutTime")} placeholder="11:00" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Policy notes</Label>
              <Textarea {...form.register("policyNotes")} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Amenity notes</Label>
              <Textarea {...form.register("amenityNotes")} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
