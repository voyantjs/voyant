import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
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
} from "@/components/ui"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

export const Route = createFileRoute("/_workspace/settings/product-tags")({
  component: ProductTagsPage,
})

type ProductTag = {
  id: string
  name: string
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
})

type FormValues = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

function ProductTagSheet({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ProductTag
  onSuccess: () => void
}) {
  const isEditing = !!item

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  useEffect(() => {
    if (open && item) {
      form.reset({
        name: item.name,
      })
    } else if (open) {
      form.reset()
    }
  }, [open, item, form])

  const onSubmit = async (values: FormOutput) => {
    if (isEditing) {
      await api.patch(`/v1/products/product-tags/${item.id}`, values)
    } else {
      await api.post("/v1/products/product-tags", values)
    }
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Tag" : "New Product Tag"}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Family Friendly" autoFocus />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Tag"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function ProductTagsPage() {
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ProductTag | undefined>()

  const { data, isPending } = useQuery({
    queryKey: ["product-tags"],
    queryFn: () => api.get<{ data: ProductTag[] }>("/v1/products/product-tags?limit=200"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/products/product-tags/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["product-tags"] }),
  })

  const items = data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Product Tags</h2>
          <p className="text-sm text-muted-foreground">
            Free-form labels to tag and filter products.
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
          Add Tag
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {isPending ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No product tags yet. Create tags like Family Friendly, Luxury, or Adventure.
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {items.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between px-6 py-3">
                <span className="text-sm font-medium">{tag.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(tag)
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
                        if (confirm("Delete this tag?")) {
                          deleteMutation.mutate(tag.id)
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

      <ProductTagSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={editing}
        onSuccess={() => {
          setSheetOpen(false)
          setEditing(undefined)
          void queryClient.invalidateQueries({ queryKey: ["product-tags"] })
        }}
      />
    </div>
  )
}
