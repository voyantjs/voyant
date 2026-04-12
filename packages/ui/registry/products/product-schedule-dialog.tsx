"use client"

import type { AvailabilityRuleRecord } from "@voyantjs/availability-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ProductScheduleForm } from "./product-schedule-form"

export interface ProductScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  rule?: AvailabilityRuleRecord
  onSuccess?: (rule: AvailabilityRuleRecord) => void
}

export function ProductScheduleDialog({
  open,
  onOpenChange,
  productId,
  rule,
  onSuccess,
}: ProductScheduleDialogProps) {
  const isEdit = Boolean(rule)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="product-schedule-dialog" className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit schedule" : "New schedule"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the recurrence rule, capacity, and booking limits for this schedule."
              : "Create a recurring rule that generates departures for this product."}
          </DialogDescription>
        </DialogHeader>
        <ProductScheduleForm
          mode={rule ? { kind: "edit", rule } : { kind: "create", productId }}
          onSuccess={(savedRule) => {
            onSuccess?.(savedRule)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
