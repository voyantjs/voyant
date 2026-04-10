import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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

export const Route = createFileRoute("/_workspace/settings/product-types")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getProductTypesQueryOptions()),
  component: ProductTypesPage,
})

type ProductType = {
  id: string
  name: string
  code: string
  description: string | null
  sortOrder: number
  active: boolean
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().min(1, "Code is required").max(100),
  description: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

function getProductTypesQueryOptions() {
  return queryOptions({
    queryKey: ["product-types"],
    queryFn: () => api.get<{ data: ProductType[] }>("/v1/products/product-types?limit=200"),
  })
}

function ProductTypeSheet({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ProductType
  onSuccess: () => void
}) {
  const isEditing = !!item

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      sortOrder: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (open && item) {
      form.reset({
        name: item.name,
        code: item.code,
        description: item.description ?? "",
        sortOrder: item.sortOrder,
        active: item.active,
      })
    } else if (open) {
      form.reset()
    }
  }, [open, item, form])

  const onSubmit = async (values: FormOutput) => {
    const payload = { ...values, description: values.description || null }
    if (isEditing) {
      await api.patch(`/v1/products/product-types/${item.id}`, payload)
    } else {
      await api.post("/v1/products/product-types", payload)
    }
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Product Type" : "New Product Type"}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetBody className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="City Break" autoFocus />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Code</Label>
                <Input {...form.register("code")} placeholder="city-break" />
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} placeholder="Optional description..." />
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
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Type"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function ProductTypesPage() {
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ProductType | undefined>()

  const { data, isPending } = useQuery(getProductTypesQueryOptions())

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/products/product-types/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["product-types"] }),
  })

  const items = data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Product Types</h2>
          <p className="text-sm text-muted-foreground">
            Classification types for your products — City Break, Circuit, Cruise, etc.
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
          Add Type
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {isPending ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No product types yet. Create types like City Break, Circuit, or Cruise.
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {items.map((pt) => (
              <div key={pt.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{pt.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{pt.code}</span>
                  {!pt.active && (
                    <Badge variant="secondary" className="text-xs">
                      inactive
                    </Badge>
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
                        setEditing(pt)
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
                        if (confirm("Delete this product type?")) {
                          deleteMutation.mutate(pt.id)
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

      <ProductTypeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={editing}
        onSuccess={() => {
          setSheetOpen(false)
          setEditing(undefined)
          void queryClient.invalidateQueries({ queryKey: ["product-types"] })
        }}
      />
    </div>
  )
}
