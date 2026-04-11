import { Plus } from "lucide-react"

import { DropdownMenuItem } from "@/components/ui"

import { ProductDetailDayRow } from "./product-detail-day-row"
import { ActionMenu, EmptyState, Section } from "./product-detail-sections"
import type { DayService, ProductDay } from "./product-detail-shared"

export interface ProductDetailItinerarySectionProps {
  productId: string
  days: ProductDay[]
  expandedDayId: string | null
  onExpandedDayIdChange: (dayId: string | null) => void
  onCreateDay: () => void
  onEditDay: (day: ProductDay) => void
  onDeleteDay: (dayId: string) => void
  onAddService: (dayId: string) => void
  onEditService: (dayId: string, service: DayService) => void
  onDeleteService: (dayId: string, serviceId: string) => void
  onUploadMedia: (dayId: string, file: File) => void
  isUploadingMedia: boolean
}

export function ProductDetailItinerarySection({
  productId,
  days,
  expandedDayId,
  onExpandedDayIdChange,
  onCreateDay,
  onEditDay,
  onDeleteDay,
  onAddService,
  onEditService,
  onDeleteService,
  onUploadMedia,
  isUploadingMedia,
}: ProductDetailItinerarySectionProps) {
  return (
    <Section
      title="Itinerary"
      actions={
        <ActionMenu>
          <DropdownMenuItem onClick={onCreateDay}>
            <Plus className="h-4 w-4" />
            Add Day
          </DropdownMenuItem>
        </ActionMenu>
      }
    >
      {days.length === 0 ? (
        <EmptyState message="No days yet. Add a day to build the itinerary." />
      ) : (
        <div className="flex flex-col gap-2">
          {days.map((day) => (
            <ProductDetailDayRow
              key={day.id}
              day={day}
              productId={productId}
              expanded={expandedDayId === day.id}
              onToggle={() => onExpandedDayIdChange(expandedDayId === day.id ? null : day.id)}
              onEdit={() => onEditDay(day)}
              onDelete={() => onDeleteDay(day.id)}
              onAddService={() => onAddService(day.id)}
              onEditService={(service) => onEditService(day.id, service)}
              onDeleteService={(serviceId) => onDeleteService(day.id, serviceId)}
              onUploadMedia={(file) => onUploadMedia(day.id, file)}
              isUploadingMedia={isUploadingMedia}
            />
          ))}
        </div>
      )}
    </Section>
  )
}
