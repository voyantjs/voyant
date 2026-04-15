"use client"

import type { ProductDayServiceRecord } from "@voyantjs/products-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  ProductDayServiceForm,
  type ProductDayServiceSupplierPickerRenderer,
} from "./product-day-service-form"

export interface ProductDayServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  dayId: string
  service?: ProductDayServiceRecord
  onSuccess?: (service: ProductDayServiceRecord) => void
  renderSupplierServicePicker?: ProductDayServiceSupplierPickerRenderer
}

export function ProductDayServiceDialog({
  open,
  onOpenChange,
  productId,
  dayId,
  service,
  onSuccess,
  renderSupplierServicePicker,
}: ProductDayServiceDialogProps) {
  const isEdit = Boolean(service)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="product-day-service-dialog" className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit day service" : "Add day service"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update supplier linkage, pricing, quantity, and notes for this itinerary service."
              : "Add a service item under the selected itinerary day."}
          </DialogDescription>
        </DialogHeader>
        <ProductDayServiceForm
          mode={
            service
              ? { kind: "edit", productId, dayId, service }
              : { kind: "create", productId, dayId }
          }
          renderSupplierServicePicker={renderSupplierServicePicker}
          onSuccess={(savedService) => {
            onSuccess?.(savedService)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
