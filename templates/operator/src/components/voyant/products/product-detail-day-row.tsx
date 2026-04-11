import { useQuery } from "@tanstack/react-query"
import {
  ChevronDown,
  ChevronRight,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react"
import { useRef } from "react"

import { Badge, Button, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui"
import { ActionMenu } from "./product-detail-sections"
import {
  type DayService,
  getProductDayMediaQueryOptions,
  getProductDayServicesQueryOptions,
  type ProductDay,
} from "./product-detail-shared"

export interface ProductDetailDayRowProps {
  day: ProductDay
  productId: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddService: () => void
  onEditService: (service: DayService) => void
  onDeleteService: (serviceId: string) => void
  onUploadMedia: (file: File) => void
  isUploadingMedia: boolean
}

export function ProductDetailDayRow({
  day,
  productId,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddService,
  onEditService,
  onDeleteService,
  onUploadMedia,
  isUploadingMedia,
}: ProductDetailDayRowProps) {
  const dayMediaInputRef = useRef<HTMLInputElement>(null)

  const { data: servicesData } = useQuery({
    ...getProductDayServicesQueryOptions(productId, day.id),
    enabled: expanded,
  })

  const { data: dayMediaData } = useQuery({
    ...getProductDayMediaQueryOptions(productId, day.id),
    enabled: expanded,
  })

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium">
            Day {day.dayNumber}
            {day.title ? `: ${day.title}` : ""}
          </span>
          {day.location ? (
            <span className="ml-2 text-xs text-muted-foreground">{day.location}</span>
          ) : null}
        </div>
        <ActionMenu>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddService}>
            <Plus className="h-4 w-4" />
            Add Service
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </ActionMenu>
      </div>

      {expanded ? (
        <div className="border-t">
          {!servicesData?.data || servicesData.data.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No services yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="py-2 pl-4 pr-3 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Cost</th>
                  <th className="px-3 py-2 text-left font-medium">Qty</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {servicesData.data.map((service) => (
                  <tr key={service.id} className="border-b last:border-b-0">
                    <td className="py-2 pl-4 pr-3">{service.name}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {service.serviceType}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {(service.costAmountCents / 100).toFixed(2)} {service.costCurrency}
                    </td>
                    <td className="px-3 py-2">{service.quantity}</td>
                    <td className="px-3 py-2">
                      <ActionMenu>
                        <DropdownMenuItem onClick={() => onEditService(service)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </ActionMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="border-t px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Photos</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                disabled={isUploadingMedia}
                onClick={() => dayMediaInputRef.current?.click()}
              >
                {isUploadingMedia ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <ImagePlus className="mr-1 h-3 w-3" />
                )}
                Add
              </Button>
              <input
                ref={dayMediaInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    onUploadMedia(file)
                    event.target.value = ""
                  }
                }}
              />
            </div>
            {dayMediaData?.data && dayMediaData.data.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dayMediaData.data.map((media) => (
                  <div
                    key={media.id}
                    className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border"
                  >
                    {media.mediaType === "image" ? (
                      <img
                        src={media.url}
                        alt={media.altText ?? media.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                        {media.mediaType}
                      </div>
                    )}
                    {media.isCover ? (
                      <div className="absolute left-0.5 top-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No photos for this day.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
