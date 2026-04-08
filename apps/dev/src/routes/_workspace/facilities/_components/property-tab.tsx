import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Button,
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

type PropertyData = {
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

type Props = { facilityId: string }

export function PropertyTab({ facilityId }: Props) {
  const { data, isPending, refetch } = useQuery({
    queryKey: ["facilities", "property", facilityId],
    queryFn: () =>
      api.get<ListResponse<PropertyData>>(
        `/v1/facilities/properties?facilityId=${facilityId}&limit=1`,
      ),
  })

  const property = data?.data?.[0]

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    if (property) {
      form.reset({
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
    }
  }, [property, form])

  const onSubmit = async (values: FormOutput) => {
    const toInt = (v: number | string | null | undefined) => (typeof v === "number" ? v : null)
    const payload = {
      facilityId,
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
    if (property) {
      await api.patch(`/v1/facilities/properties/${property.id}`, payload)
    } else {
      await api.post("/v1/facilities/properties", payload)
    }
    void refetch()
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <p className="mb-4 text-sm text-muted-foreground">
        {property
          ? "Extends this facility with hospitality-specific fields (rating, check-in/out, brand)."
          : "No property row exists for this facility yet. Fill out this form to create one."}
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            <Input {...form.register("brandName")} placeholder="Hilton" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Group name</Label>
            <Input {...form.register("groupName")} placeholder="Collection Brands" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Rating</Label>
            <Input {...form.register("rating")} type="number" min="0" max="10" placeholder="4" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Rating scale</Label>
            <Input {...form.register("ratingScale")} type="number" min="1" placeholder="5" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Check-in time</Label>
            <Input {...form.register("checkInTime")} placeholder="14:00" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Check-out time</Label>
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

        <div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {property ? "Save Changes" : "Create Property"}
          </Button>
        </div>
      </form>
    </div>
  )
}
