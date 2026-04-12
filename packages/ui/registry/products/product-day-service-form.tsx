"use client"

import {
  type ProductDayServiceRecord,
  useProductDayServiceMutation,
} from "@voyantjs/products-react"
import { Loader2 } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type ServiceType = ProductDayServiceRecord["serviceType"]

type Mode =
  | { kind: "create"; productId: string; dayId: string }
  | { kind: "edit"; productId: string; dayId: string; service: ProductDayServiceRecord }

export interface ProductDayServiceFormProps {
  mode: Mode
  onSuccess?: (service: ProductDayServiceRecord) => void
  onCancel?: () => void
}

interface FormState {
  serviceType: ServiceType
  name: string
  description: string
  supplierServiceId: string
  costCurrency: string
  costAmount: string
  quantity: string
  sortOrder: string
  notes: string
}

const SERVICE_TYPES: Array<{ value: ServiceType; label: string }> = [
  { value: "accommodation", label: "Accommodation" },
  { value: "transfer", label: "Transfer" },
  { value: "experience", label: "Experience" },
  { value: "guide", label: "Guide" },
  { value: "meal", label: "Meal" },
  { value: "other", label: "Other" },
]

function initialState(mode: Mode): FormState {
  if (mode.kind === "edit") {
    return {
      serviceType: mode.service.serviceType,
      name: mode.service.name,
      description: mode.service.description ?? "",
      supplierServiceId: mode.service.supplierServiceId ?? "",
      costCurrency: mode.service.costCurrency,
      costAmount: (mode.service.costAmountCents / 100).toFixed(2),
      quantity: String(mode.service.quantity),
      sortOrder: mode.service.sortOrder == null ? "" : String(mode.service.sortOrder),
      notes: mode.service.notes ?? "",
    }
  }

  return {
    serviceType: "accommodation",
    name: "",
    description: "",
    supplierServiceId: "",
    costCurrency: "EUR",
    costAmount: "0.00",
    quantity: "1",
    sortOrder: "",
    notes: "",
  }
}

export function ProductDayServiceForm({ mode, onSuccess, onCancel }: ProductDayServiceFormProps) {
  const [state, setState] = React.useState<FormState>(() => initialState(mode))
  const [error, setError] = React.useState<string | null>(null)
  const { create, update } = useProductDayServiceMutation()

  React.useEffect(() => {
    setState(initialState(mode))
    setError(null)
  }, [mode])

  const isSubmitting = create.isPending || update.isPending

  const field =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => {
      setState((previous) => ({ ...previous, [key]: value }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!state.name.trim()) {
      setError("Service name is required.")
      return
    }

    const costAmount = Number.parseFloat(state.costAmount || "0")
    const quantity = Number.parseInt(state.quantity || "0", 10)
    if (!Number.isFinite(costAmount) || costAmount < 0) {
      setError("Cost must be zero or greater.")
      return
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      setError("Quantity must be at least 1.")
      return
    }

    const payload = {
      serviceType: state.serviceType,
      name: state.name.trim(),
      description: state.description.trim() ? state.description.trim() : null,
      supplierServiceId: state.supplierServiceId.trim() ? state.supplierServiceId.trim() : null,
      costCurrency: state.costCurrency.trim().toUpperCase(),
      costAmountCents: Math.round(costAmount * 100),
      quantity,
      sortOrder: state.sortOrder.trim() ? Number.parseInt(state.sortOrder, 10) || 0 : null,
      notes: state.notes.trim() ? state.notes.trim() : null,
    }

    try {
      const service =
        mode.kind === "create"
          ? (
              await create.mutateAsync({
                productId: mode.productId,
                dayId: mode.dayId,
                ...payload,
              })
            ).data
          : (
              await update.mutateAsync({
                productId: mode.productId,
                dayId: mode.dayId,
                serviceId: mode.service.id,
                input: payload,
              })
            ).data
      onSuccess?.(service)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Failed to save service.",
      )
    }
  }

  return (
    <form
      data-slot="product-day-service-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Service type</Label>
          <Select
            value={state.serviceType}
            onValueChange={(value) => field("serviceType")(value as ServiceType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-day-service-name">Name</Label>
          <Input
            id="product-day-service-name"
            autoFocus
            required
            value={state.name}
            onChange={(event) => field("name")(event.target.value)}
            placeholder="Deluxe sea view room"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-day-service-description">Description</Label>
        <Textarea
          id="product-day-service-description"
          value={state.description}
          onChange={(event) => field("description")(event.target.value)}
          placeholder="Optional service details"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-day-service-supplier-service">Supplier service ID</Label>
          <Input
            id="product-day-service-supplier-service"
            value={state.supplierServiceId}
            onChange={(event) => field("supplierServiceId")(event.target.value)}
            placeholder="Optional supplier service reference"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-day-service-sort-order">Sort order</Label>
          <Input
            id="product-day-service-sort-order"
            type="number"
            value={state.sortOrder}
            onChange={(event) => field("sortOrder")(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-day-service-cost-currency">Currency</Label>
          <Input
            id="product-day-service-cost-currency"
            value={state.costCurrency}
            onChange={(event) => field("costCurrency")(event.target.value)}
            maxLength={3}
            placeholder="EUR"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-day-service-cost-amount">Cost</Label>
          <Input
            id="product-day-service-cost-amount"
            type="number"
            min="0"
            step="0.01"
            value={state.costAmount}
            onChange={(event) => field("costAmount")(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-day-service-quantity">Quantity</Label>
          <Input
            id="product-day-service-quantity"
            type="number"
            min="1"
            value={state.quantity}
            onChange={(event) => field("quantity")(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-day-service-notes">Notes</Label>
        <Textarea
          id="product-day-service-notes"
          value={state.notes}
          onChange={(event) => field("notes")(event.target.value)}
          placeholder="Internal notes"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {mode.kind === "create" ? "Add service" : "Save service"}
        </Button>
      </div>
    </form>
  )
}
