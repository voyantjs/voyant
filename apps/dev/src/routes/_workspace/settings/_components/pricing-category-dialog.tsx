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
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().max(100).optional().nullable(),
  categoryType: z.enum([
    "adult",
    "child",
    "infant",
    "senior",
    "group",
    "room",
    "vehicle",
    "service",
    "other",
  ]),
  isAgeQualified: z.boolean(),
  minAge: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  maxAge: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  seatOccupancy: z.coerce.number().int().min(0),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
})

type CategoryFormValues = z.input<typeof categoryFormSchema>
type CategoryFormOutput = z.output<typeof categoryFormSchema>

export type PricingCategoryData = {
  id: string
  name: string
  code: string | null
  categoryType:
    | "adult"
    | "child"
    | "infant"
    | "senior"
    | "group"
    | "room"
    | "vehicle"
    | "service"
    | "other"
  isAgeQualified: boolean
  minAge: number | null
  maxAge: number | null
  seatOccupancy: number
  sortOrder: number
  active: boolean
  productId: string | null
  optionId: string | null
  unitId: string | null
}

type PricingCategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: PricingCategoryData
  onSuccess: () => void
}

const CATEGORY_TYPES = [
  { value: "adult", label: "Adult" },
  { value: "child", label: "Child" },
  { value: "infant", label: "Infant" },
  { value: "senior", label: "Senior" },
  { value: "group", label: "Group" },
  { value: "room", label: "Room" },
  { value: "vehicle", label: "Vehicle" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
] as const

export function PricingCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: PricingCategoryDialogProps) {
  const isEditing = !!category

  const form = useForm<CategoryFormValues, unknown, CategoryFormOutput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      code: "",
      categoryType: "adult",
      isAgeQualified: false,
      minAge: "",
      maxAge: "",
      seatOccupancy: 1,
      sortOrder: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (open && category) {
      form.reset({
        name: category.name,
        code: category.code ?? "",
        categoryType: category.categoryType,
        isAgeQualified: category.isAgeQualified,
        minAge: category.minAge ?? "",
        maxAge: category.maxAge ?? "",
        seatOccupancy: category.seatOccupancy,
        sortOrder: category.sortOrder,
        active: category.active,
      })
    } else if (open) {
      form.reset()
    }
  }, [open, category, form])

  const onSubmit = async (values: CategoryFormOutput) => {
    const payload = {
      name: values.name,
      code: values.code || null,
      categoryType: values.categoryType,
      isAgeQualified: values.isAgeQualified,
      minAge: typeof values.minAge === "number" ? values.minAge : null,
      maxAge: typeof values.maxAge === "number" ? values.maxAge : null,
      seatOccupancy: values.seatOccupancy,
      sortOrder: values.sortOrder,
      active: values.active,
    }

    if (isEditing) {
      await api.patch(`/v1/pricing/pricing-categories/${category.id}`, payload)
    } else {
      await api.post("/v1/pricing/pricing-categories", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Pricing Category" : "New Pricing Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Adult" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="adult" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={form.watch("categoryType")}
                  onValueChange={(v) =>
                    form.setValue("categoryType", v as CategoryFormValues["categoryType"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Seat occupancy</Label>
                <Input {...form.register("seatOccupancy")} type="number" min="0" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("isAgeQualified")}
                onCheckedChange={(v) => form.setValue("isAgeQualified", v)}
              />
              <Label>Age qualified</Label>
            </div>

            {form.watch("isAgeQualified") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Min age</Label>
                  <Input {...form.register("minAge")} type="number" min="0" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Max age</Label>
                  <Input {...form.register("maxAge")} type="number" min="0" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Sort order</Label>
                <Input {...form.register("sortOrder")} type="number" />
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
              {isEditing ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
