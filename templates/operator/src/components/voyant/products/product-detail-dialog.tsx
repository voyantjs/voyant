import { useQuery } from "@tanstack/react-query"
import { currencies } from "@voyantjs/utils/currencies"
import { Loader2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import {
  Badge,
  Button,
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
  Textarea,
} from "@/components/ui"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { useAdminMessages } from "@/lib/admin-i18n"
import { api } from "@/lib/api-client"
import { zodResolver } from "@/lib/zod-resolver"

const CURRENCY_OPTIONS = Object.values(currencies).map((c) => ({
  value: c.code,
  label: `${c.code} — ${c.name} (${c.symbol})`,
}))

type ProductData = {
  id: string
  name: string
  status: "draft" | "active" | "archived"
  description: string | null
  bookingMode: "date" | "date_time" | "open" | "stay" | "transfer" | "itinerary" | "other"
  productTypeId: string | null
  sellCurrency: string
  tags: string[]
}

type ProductTypeOption = {
  id: string
  name: string
  code: string
  active: boolean
}

type ProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: ProductData
  onSuccess: (id?: string) => void
}

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const messages = useAdminMessages()
  const productMessages = messages.products.core
  const isEditing = !!product
  const productFormSchema = z.object({
    name: z.string().min(1, productMessages.validationNameRequired),
    status: z.enum(["draft", "active", "archived"]),
    description: z.string().optional().nullable(),
    bookingMode: z.enum(["date", "date_time", "open", "stay", "transfer", "itinerary", "other"]),
    productTypeId: z.string().optional().nullable(),
    sellCurrency: z
      .string()
      .min(3, productMessages.validationIsoCurrency)
      .max(3, productMessages.validationIsoCurrency),
    tags: z.array(z.string()).default([]),
  })
  type ProductFormValues = z.input<typeof productFormSchema>
  type ProductFormOutput = z.output<typeof productFormSchema>
  const productStatuses = [
    { value: "draft", label: productMessages.statusDraft },
    { value: "active", label: productMessages.statusActive },
    { value: "archived", label: productMessages.statusArchived },
  ] as const
  const bookingModes = [
    { value: "date", label: productMessages.bookingModeDate },
    { value: "date_time", label: productMessages.bookingModeDateTime },
    { value: "open", label: productMessages.bookingModeOpen },
    { value: "stay", label: productMessages.bookingModeStay },
    { value: "transfer", label: productMessages.bookingModeTransfer },
    { value: "itinerary", label: productMessages.bookingModeItinerary },
    { value: "other", label: productMessages.bookingModeOther },
  ] as const

  const form = useForm<ProductFormValues, unknown, ProductFormOutput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      status: "draft",
      description: "",
      bookingMode: "itinerary",
      productTypeId: "",
      sellCurrency: "EUR",
      tags: [],
    },
  })

  const [tagInput, setTagInput] = useState("")

  const { data: typesData } = useQuery({
    queryKey: ["product-types"],
    queryFn: () =>
      api.get<{ data: ProductTypeOption[] }>("/v1/products/product-types?limit=25&active=true"),
  })

  const productTypes = typesData?.data ?? []

  useEffect(() => {
    if (open && product) {
      form.reset({
        name: product.name,
        status: product.status,
        description: product.description ?? "",
        bookingMode: product.bookingMode,
        productTypeId: product.productTypeId ?? "",
        sellCurrency: product.sellCurrency,
        tags: product.tags ?? [],
      })
      setTagInput("")
    } else if (open) {
      form.reset()
      setTagInput("")
    }
  }, [open, product, form])

  const onSubmit = async (values: ProductFormOutput) => {
    const payload = {
      name: values.name,
      status: values.status,
      description: values.description || null,
      bookingMode: values.bookingMode,
      productTypeId: values.productTypeId || null,
      sellCurrency: values.sellCurrency,
      tags: values.tags,
    }

    if (isEditing) {
      await api.patch(`/v1/products/${product.id}`, payload)
      onSuccess()
    } else {
      const result = await api.post<{ id: string }>("/v1/products", payload)
      onSuccess(result.id)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? productMessages.detailSheetEditTitle : productMessages.detailSheetNewTitle}
          </SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetBody className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>{productMessages.nameLabel}</Label>
              <Input
                {...form.register("name")}
                placeholder={productMessages.namePlaceholder}
                autoFocus
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>{productMessages.descriptionLabel}</Label>
              <Textarea
                {...form.register("description")}
                placeholder={productMessages.descriptionPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{productMessages.tagsLabel}</Label>
              <div className="flex flex-wrap gap-1.5">
                {(form.watch("tags") ?? []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                    {tag}
                    <button
                      type="button"
                      className="ml-0.5 rounded-full hover:text-destructive"
                      onClick={() => {
                        const current = form.getValues("tags") ?? []
                        form.setValue(
                          "tags",
                          current.filter((t) => t !== tag),
                          { shouldDirty: true },
                        )
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault()
                    const value = tagInput.trim().replace(/,+$/, "")
                    const current = form.getValues("tags") ?? []
                    if (value && !current.includes(value)) {
                      form.setValue("tags", [...current, value], { shouldDirty: true })
                    }
                    setTagInput("")
                  }
                }}
                placeholder={productMessages.tagInputPlaceholder}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>{productMessages.bookingModeLabel}</Label>
                <Select
                  value={form.watch("bookingMode")}
                  onValueChange={(v) =>
                    form.setValue("bookingMode", v as ProductFormValues["bookingMode"])
                  }
                  items={bookingModes}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bookingModes.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{productMessages.productTypeLabel}</Label>
                <Select
                  value={form.watch("productTypeId") ?? ""}
                  onValueChange={(v) =>
                    form.setValue("productTypeId", v === "__none__" ? null : v, {
                      shouldDirty: true,
                    })
                  }
                  items={[
                    { value: "__none__", label: productMessages.productTypeNone },
                    ...productTypes.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={productMessages.productTypeNone} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{productMessages.productTypeNone}</SelectItem>
                    {productTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>{productMessages.statusLabel}</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(v) => form.setValue("status", v as ProductFormValues["status"])}
                    items={productStatuses}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productStatuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{productMessages.sellCurrencyLabel}</Label>
                  <CurrencyCombobox
                    value={form.watch("sellCurrency")}
                    onChange={(v) => form.setValue("sellCurrency", v, { shouldDirty: true })}
                    messages={productMessages}
                  />
                  {form.formState.errors.sellCurrency && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.sellCurrency.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              {productMessages.cancel}
            </Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? productMessages.saveChanges : productMessages.createProduct}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function CurrencyCombobox({
  value,
  onChange,
  messages,
}: {
  value: string
  onChange: (value: string) => void
  messages: ReturnType<typeof useAdminMessages>["products"]["core"]
}) {
  return (
    <Combobox value={value} onValueChange={(v) => onChange(v ?? "")}>
      <ComboboxInput placeholder={messages.currencySearchPlaceholder} className="w-full" />
      <ComboboxContent>
        <ComboboxList>
          {CURRENCY_OPTIONS.map((c) => (
            <ComboboxItem key={c.value} value={c.value}>
              <span className="font-mono text-xs">{c.value}</span>
              <span className="truncate text-muted-foreground">{c.label.split(" — ")[1]}</span>
            </ComboboxItem>
          ))}
          <ComboboxEmpty>{messages.currencyEmpty}</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
