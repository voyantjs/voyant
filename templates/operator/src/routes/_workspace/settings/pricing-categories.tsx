import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

export const Route = createFileRoute("/_workspace/settings/pricing-categories")({
  component: PricingCategoriesPage,
})

type PricingCategory = {
  id: string
  name: string
  code: string | null
  categoryType: string
  seatOccupancy: number
  isAgeQualified: boolean
  minAge: number | null
  maxAge: number | null
  active: boolean
  sortOrder: number
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
  seatOccupancy: z.coerce.number().int().min(0),
  isAgeQualified: z.boolean(),
  minAge: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  maxAge: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  active: z.boolean(),
  sortOrder: z.coerce.number().int(),
})

type CategoryFormValues = z.input<typeof categoryFormSchema>
type CategoryFormOutput = z.output<typeof categoryFormSchema>

function CategorySheet({
  open,
  onOpenChange,
  category,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: PricingCategory
  onSuccess: () => void
}) {
  const isEditing = !!category

  const form = useForm<CategoryFormValues, unknown, CategoryFormOutput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      code: "",
      categoryType: "adult",
      seatOccupancy: 1,
      isAgeQualified: false,
      minAge: "",
      maxAge: "",
      active: true,
      sortOrder: 0,
    },
  })

  useEffect(() => {
    if (open && category) {
      form.reset({
        name: category.name,
        code: category.code ?? "",
        categoryType: category.categoryType as CategoryFormValues["categoryType"],
        seatOccupancy: category.seatOccupancy,
        isAgeQualified: category.isAgeQualified,
        minAge: category.minAge ?? "",
        maxAge: category.maxAge ?? "",
        active: category.active,
        sortOrder: category.sortOrder,
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
      seatOccupancy: values.seatOccupancy,
      isAgeQualified: values.isAgeQualified,
      minAge: typeof values.minAge === "number" ? values.minAge : null,
      maxAge: typeof values.maxAge === "number" ? values.maxAge : null,
      active: values.active,
      sortOrder: values.sortOrder,
    }

    if (isEditing) {
      await api.patch(`/v1/pricing/pricing-categories/${category.id}`, payload)
    } else {
      await api.post("/v1/pricing/pricing-categories", payload)
    }
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Category" : "New Pricing Category"}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Adult" autoFocus />
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
                  items={CATEGORY_TYPES}
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
                <Label>Seat Occupancy</Label>
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
                  <Label>Min Age</Label>
                  <Input {...form.register("minAge")} type="number" min="0" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Max Age</Label>
                  <Input {...form.register("maxAge")} type="number" min="0" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Sort Order</Label>
                <Input {...form.register("sortOrder")} type="number" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={form.watch("active")}
                  onCheckedChange={(v) => form.setValue("active", v)}
                />
                <Label>Active</Label>
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Category"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function PricingCategoriesPage() {
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PricingCategory | undefined>()

  const { data, isPending } = useQuery({
    queryKey: ["pricing-categories-global"],
    queryFn: () => api.get<{ data: PricingCategory[] }>("/v1/pricing/pricing-categories?limit=200"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pricing/pricing-categories/${id}`),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["pricing-categories-global"] }),
  })

  const categories = data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Pricing Categories</h2>
          <p className="text-sm text-muted-foreground">
            Traveler types used for per-category pricing on product options.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setSheetOpen(true)
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Category
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {isPending ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No pricing categories yet. Create categories like Adult, Child, Senior to enable
            per-category pricing on product options.
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{cat.name}</span>
                    {cat.code && <span className="text-xs text-muted-foreground">{cat.code}</span>}
                    <Badge variant="outline" className="text-xs capitalize">
                      {cat.categoryType}
                    </Badge>
                    {!cat.active && (
                      <Badge variant="secondary" className="text-xs">
                        inactive
                      </Badge>
                    )}
                  </div>
                  {cat.isAgeQualified && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Age: {cat.minAge ?? 0}–{cat.maxAge ?? "\u221E"}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(cat)
                        setSheetOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Delete this pricing category?")) {
                          deleteMutation.mutate(cat.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      <CategorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        category={editing}
        onSuccess={() => {
          setSheetOpen(false)
          setEditing(undefined)
          void queryClient.invalidateQueries({ queryKey: ["pricing-categories-global"] })
        }}
      />
    </div>
  )
}
