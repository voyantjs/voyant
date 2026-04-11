import { Link } from "@tanstack/react-router"
import { CalendarCheck, ChevronRight, Pencil, Trash2 } from "lucide-react"

import { Badge, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui"

import { ActionMenu } from "./product-detail-sections"
import type { ProductRecord } from "./product-detail-shared"
import { statusVariant } from "./product-detail-shared"

export interface ProductDetailHeaderProps {
  product: ProductRecord
  isConvertingToBooking: boolean
  isDeleting: boolean
  onEdit: () => void
  onConvertToBooking: () => void
  onDelete: () => void
}

export function ProductDetailHeader({
  product,
  isConvertingToBooking,
  isDeleting,
  onEdit,
  onConvertToBooking,
  onDelete,
}: ProductDetailHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/products" className="transition-colors hover:text-foreground">
          Products
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-normal text-foreground">{product.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <Badge variant={statusVariant[product.status] ?? "secondary"} className="capitalize">
            {product.status}
          </Badge>
        </div>
        <ActionMenu>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={isConvertingToBooking} onClick={onConvertToBooking}>
            <CalendarCheck className="h-4 w-4" />
            Convert to Booking
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={isDeleting} onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </ActionMenu>
      </div>
    </>
  )
}
