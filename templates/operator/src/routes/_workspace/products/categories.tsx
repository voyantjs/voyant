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
  Textarea,
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

export const Route = createFileRoute("/_workspace/products/categories")({
  component: CategoriesPage,
})

type ProductCategory = {
  id: string
  parentId: string | null
  name: string
  slug: string
  description: string | null
  sortOrder: number
  active: boolean
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  parentId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

function CategorySheet({
  open,
  onOpenChange,
  item,
  categories,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ProductCategory
  categories: ProductCategory[]
  onSuccess: () => void
}) {
  const isEditing = !!item

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      parentId: "",
      description: "",
      sortOrder: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (open && item) {
      form.reset({
        name: item.name,
        slug: item.slug,
        parentId: item.parentId ?? "",
        description: item.description ?? "",
        sortOrder: item.sortOrder,
        active: item.active,
      })
    } else if (open) {
      form.reset()
    }
  }, [open, item, form])

  const parentOptions = categories.filter((c) => c.id !== item?.id)

  const onSubmit = async (values: FormOutput) => {
    const payload = {
      ...values,
      parentId: values.parentId || null,
      description: values.description || null,
    }
    if (isEditing) {
      await api.patch(`/v1/products/product-categories/${item.id}`, payload)
    } else {
      await api.post("/v1/products/product-categories", payload)
    }
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Category" : "New Category"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <SheetBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Adventure" autoFocus />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Slug</Label>
                <Input {...form.register("slug")} placeholder="adventure" />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Parent Category</Label>
              <Select
                value={form.watch("parentId") ?? ""}
                onValueChange={(v) => form.setValue("parentId", v === "__none__" ? null : v, { shouldDirty: true })}
                items={[{ value: "__none__", label: "None (top-level)" }, ...parentOptions.map((c) => ({ value: c.id, label: c.name }))]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (top-level)</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} placeholder="Category description..." />
            </div>

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
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
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

function CategoriesPage() {
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ProductCategory | undefined>()

  const { data, isPending } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () =>
      api.get<{ data: ProductCategory[] }>("/v1/products/product-categories?limit=200"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/products/product-categories/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["product-categories"] }),
  })

  const items = data?.data ?? []

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null
    const parent = items.find((c) => c.id === parentId)
    return parent?.name ?? null
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Hierarchical product categories for organizing your catalog.
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
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No categories yet. Create categories like Adventure, Cultural, or Food & Wine.
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {items.map((cat) => {
              const parentName = getParentName(cat.parentId)
              return (
                <div key={cat.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{cat.slug}</span>
                      {parentName && (
                        <Badge variant="outline" className="text-xs">
                          {parentName}
                        </Badge>
                      )}
                      {!cat.active && (
                        <Badge variant="secondary" className="text-xs">
                          inactive
                        </Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{cat.description}</p>
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
                          if (confirm("Delete this category?")) {
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
              )
            })}
          </div>
        )}
      </div>

      <CategorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={editing}
        categories={items}
        onSuccess={() => {
          setSheetOpen(false)
          setEditing(undefined)
          void queryClient.invalidateQueries({ queryKey: ["product-categories"] })
        }}
      />
    </div>
  )
}
