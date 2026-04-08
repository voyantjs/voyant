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
type PricingCategoryLite = { id: string; name: string; code: string | null }

const DEPENDENCY_TYPES = ["requires", "limits_per_master", "limits_sum", "excludes"] as const
type DependencyType = (typeof DEPENDENCY_TYPES)[number]

const formSchema = z.object({
  pricingCategoryId: z.string().min(1, "Dependent category is required"),
  masterPricingCategoryId: z.string().min(1, "Master category is required"),
  dependencyType: z.enum(DEPENDENCY_TYPES),
  maxPerMaster: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  maxDependentSum: z.coerce.number().int().min(0).optional().or(z.literal("")).nullable(),
  active: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export type PricingCategoryDependencyData = {
  id: string
  pricingCategoryId: string
  masterPricingCategoryId: string
  dependencyType: DependencyType
  maxPerMaster: number | null
  maxDependentSum: number | null
  active: boolean
  notes: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dependency?: PricingCategoryDependencyData
  onSuccess: () => void
}

const toInt = (v: number | "" | null | undefined): number | null =>
  typeof v === "number" ? v : null

export function PricingCategoryDependencyDialog({
  open,
  onOpenChange,
  dependency,
  onSuccess,
}: Props) {
  const isEditing = !!dependency

  const categoriesQuery = useQuery({
    queryKey: ["pricing", "dep-dialog", "categories"],
    queryFn: () =>
      api.get<ListResponse<PricingCategoryLite>>("/v1/pricing/pricing-categories?limit=200"),
    enabled: open,
  })
  const categories = categoriesQuery.data?.data ?? []

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pricingCategoryId: "",
      masterPricingCategoryId: "",
      dependencyType: "requires",
      maxPerMaster: "",
      maxDependentSum: "",
      active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open && dependency) {
      form.reset({
        pricingCategoryId: dependency.pricingCategoryId,
        masterPricingCategoryId: dependency.masterPricingCategoryId,
        dependencyType: dependency.dependencyType,
        maxPerMaster: dependency.maxPerMaster ?? "",
        maxDependentSum: dependency.maxDependentSum ?? "",
        active: dependency.active,
        notes: dependency.notes ?? "",
      })
    } else if (open) {
      form.reset({
        pricingCategoryId: "",
        masterPricingCategoryId: "",
        dependencyType: "requires",
        maxPerMaster: "",
        maxDependentSum: "",
        active: true,
        notes: "",
      })
    }
  }, [open, dependency, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      pricingCategoryId: values.pricingCategoryId,
      masterPricingCategoryId: values.masterPricingCategoryId,
      dependencyType: values.dependencyType,
      maxPerMaster: toInt(values.maxPerMaster),
      maxDependentSum: toInt(values.maxDependentSum),
      active: values.active,
      notes: values.notes || null,
    }
    if (isEditing) {
      await api.patch(`/v1/pricing/pricing-category-dependencies/${dependency.id}`, payload)
    } else {
      await api.post("/v1/pricing/pricing-category-dependencies", payload)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category Dependency" : "Add Category Dependency"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Master category</Label>
                <select
                  {...form.register("masterPricingCategoryId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.code ? ` (${c.code})` : ""}
                    </option>
                  ))}
                </select>
                {form.formState.errors.masterPricingCategoryId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.masterPricingCategoryId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Dependent category</Label>
                <select
                  {...form.register("pricingCategoryId")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.code ? ` (${c.code})` : ""}
                    </option>
                  ))}
                </select>
                {form.formState.errors.pricingCategoryId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.pricingCategoryId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Dependency type</Label>
              <Select
                value={form.watch("dependencyType")}
                onValueChange={(v) => form.setValue("dependencyType", v as DependencyType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPENDENCY_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Max per master</Label>
                <Input {...form.register("maxPerMaster")} type="number" min="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Max dependent sum</Label>
                <Input {...form.register("maxDependentSum")} type="number" min="0" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(v) => form.setValue("active", v)}
              />
              <Label>Active</Label>
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
              {isEditing ? "Save Changes" : "Add Dependency"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
