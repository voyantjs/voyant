"use client"

import {
  type ProductDayRecord,
  type ProductDayServiceRecord,
  type ProductItineraryRecord,
  useProductDayMutation,
  useProductDayServiceMutation,
  useProductDayServices,
  useProductItineraries,
  useProductItineraryDays,
  useProductItineraryMutation,
} from "@voyantjs/products-react"
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react"
import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { ProductDayDialog } from "./product-day-dialog"
import { ProductDayServiceDialog } from "./product-day-service-dialog"
import type { ProductDayServiceSupplierPickerRenderer } from "./product-day-service-form"
import { ProductItineraryDialog } from "./product-itinerary-dialog"
import { ProductMediaSection, type ProductMediaUploadHandler } from "./product-media-section"

const serviceTypeLabels: Record<ProductDayServiceRecord["serviceType"], string> = {
  accommodation: "Accommodation",
  transfer: "Transfer",
  experience: "Experience",
  guide: "Guide",
  meal: "Meal",
  other: "Other",
}

export interface ProductItinerarySectionProps {
  productId: string
  title?: string
  titleMultiple?: string
  description?: string
  descriptionMultiple?: string
  uploadMedia?: ProductMediaUploadHandler
  renderSupplierServicePicker?: ProductDayServiceSupplierPickerRenderer
  renderDayMediaSection?: (args: {
    productId: string
    day: ProductDayRecord
    defaultSection: React.ReactNode
  }) => React.ReactNode
}

export function ProductItinerarySection({
  productId,
  title = "Itinerary",
  titleMultiple = "Itineraries",
  description = "Manage day-by-day structure and attached services for this product.",
  descriptionMultiple = "Manage the itinerary variants for this product.",
  uploadMedia,
  renderSupplierServicePicker,
  renderDayMediaSection,
}: ProductItinerarySectionProps) {
  const [expandedDayId, setExpandedDayId] = React.useState<string | null>(null)
  const [selectedItineraryId, setSelectedItineraryId] = React.useState<string | null>(null)
  const [dayDialogOpen, setDayDialogOpen] = React.useState(false)
  const [editingDay, setEditingDay] = React.useState<ProductDayRecord | undefined>()
  const [serviceDialogOpen, setServiceDialogOpen] = React.useState(false)
  const [serviceDayId, setServiceDayId] = React.useState("")
  const [editingService, setEditingService] = React.useState<ProductDayServiceRecord | undefined>()
  const [itineraryDialogOpen, setItineraryDialogOpen] = React.useState(false)
  const [editingItinerary, setEditingItinerary] = React.useState<
    ProductItineraryRecord | undefined
  >()
  const [deleteItineraryTarget, setDeleteItineraryTarget] =
    React.useState<ProductItineraryRecord | null>(null)

  const itineraryQuery = useProductItineraries(productId)
  const itineraryMutation = useProductItineraryMutation()
  const itineraries = React.useMemo(
    () => itineraryQuery.data?.data ?? [],
    [itineraryQuery.data?.data],
  )
  const hasMultiple = itineraries.length > 1

  React.useEffect(() => {
    if (itineraries.length === 0) {
      setSelectedItineraryId(null)
      return
    }

    setSelectedItineraryId((current) => {
      if (current && itineraries.some((itinerary) => itinerary.id === current)) {
        return current
      }

      return itineraries.find((itinerary) => itinerary.isDefault)?.id ?? itineraries[0]?.id ?? null
    })
  }, [itineraries])

  const selectedItinerary = React.useMemo(
    () => itineraries.find((itinerary) => itinerary.id === selectedItineraryId),
    [itineraries, selectedItineraryId],
  )

  const daysQuery = useProductItineraryDays(productId, selectedItineraryId, {
    enabled: Boolean(selectedItineraryId),
  })
  const { remove: removeDay } = useProductDayMutation()
  const days = React.useMemo(
    () =>
      (daysQuery.data?.data ?? []).slice().sort((left, right) => left.dayNumber - right.dayNumber),
    [daysQuery.data?.data],
  )
  const nextDayNumber = days.length > 0 ? Math.max(...days.map((day) => day.dayNumber)) + 1 : 1

  const openCreateItinerary = () => {
    setEditingItinerary(undefined)
    setItineraryDialogOpen(true)
  }

  const openRenameItinerary = (itinerary: ProductItineraryRecord) => {
    setEditingItinerary(itinerary)
    setItineraryDialogOpen(true)
  }

  const handleSetDefault = async (itinerary: ProductItineraryRecord) => {
    if (itinerary.isDefault) return
    await itineraryMutation.update.mutateAsync({
      productId,
      itineraryId: itinerary.id,
      input: { isDefault: true },
    })
  }

  const handleDuplicate = async (itinerary: ProductItineraryRecord) => {
    const result = await itineraryMutation.duplicate.mutateAsync({
      productId,
      itineraryId: itinerary.id,
    })
    setExpandedDayId(null)
    setSelectedItineraryId(result.itinerary.id)
  }

  const handleConfirmDeleteItinerary = async () => {
    if (!deleteItineraryTarget) return
    await itineraryMutation.remove.mutateAsync({
      productId,
      itineraryId: deleteItineraryTarget.id,
    })
    setDeleteItineraryTarget(null)
  }

  return (
    <Card data-slot="product-itinerary-section">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{hasMultiple ? titleMultiple : title}</CardTitle>
          <CardDescription>{hasMultiple ? descriptionMultiple : description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={!selectedItinerary}
            onClick={() => {
              setEditingDay(undefined)
              setDayDialogOpen(true)
            }}
          >
            <Plus className="mr-2 size-4" aria-hidden="true" />
            Add day
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Itinerary options">
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openCreateItinerary}>
                <Plus className="size-4" aria-hidden="true" />
                New itinerary
              </DropdownMenuItem>
              {selectedItinerary && !hasMultiple ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openRenameItinerary(selectedItinerary)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Rename itinerary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleDuplicate(selectedItinerary)}>
                    <Copy className="size-4" aria-hidden="true" />
                    Duplicate itinerary
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {itineraryQuery.isPending ? (
          <div className="flex min-h-24 items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : itineraryQuery.isError ? (
          <p className="text-sm text-destructive">Failed to load itineraries.</p>
        ) : itineraries.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-md border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              No itinerary yet. Create one to start adding days.
            </p>
            <Button variant="outline" size="sm" onClick={openCreateItinerary}>
              <Plus className="mr-2 size-4" aria-hidden="true" />
              New itinerary
            </Button>
          </div>
        ) : (
          <>
            {hasMultiple ? (
              <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/30 p-1">
                {itineraries.map((itinerary) => {
                  const isSelected = itinerary.id === selectedItineraryId
                  return (
                    <div
                      key={itinerary.id}
                      className={`flex items-center gap-1 rounded-sm pl-2 pr-1 transition-colors ${
                        isSelected ? "bg-background shadow-sm" : "hover:bg-background/60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedDayId(null)
                          setSelectedItineraryId(itinerary.id)
                        }}
                        className="flex items-center gap-2 py-1.5 text-sm"
                      >
                        <span className={isSelected ? "font-medium" : "text-muted-foreground"}>
                          {itinerary.name}
                        </span>
                        {itinerary.isDefault ? (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                            Default
                          </Badge>
                        ) : null}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${itinerary.name} options`}
                            className="size-6 text-muted-foreground"
                          >
                            <MoreHorizontal className="size-3.5" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openRenameItinerary(itinerary)}>
                            <Pencil className="size-4" aria-hidden="true" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void handleDuplicate(itinerary)}>
                            <Copy className="size-4" aria-hidden="true" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={itinerary.isDefault}
                            onClick={() => handleSetDefault(itinerary)}
                          >
                            <Star className="size-4" aria-hidden="true" />
                            Set as default
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={itinerary.isDefault && itineraries.length > 1}
                            onClick={() => setDeleteItineraryTarget(itinerary)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {daysQuery.isPending ? (
              <div className="flex min-h-24 items-center justify-center">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : daysQuery.isError ? (
              <p className="text-sm text-destructive">Failed to load itinerary days.</p>
            ) : days.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                No days configured yet. Click "Add day" to start.
              </p>
            ) : (
              days.map((day) => (
                <DayRow
                  key={day.id}
                  productId={productId}
                  day={day}
                  expanded={expandedDayId === day.id}
                  onToggle={() =>
                    setExpandedDayId((current) => (current === day.id ? null : day.id))
                  }
                  onEdit={() => {
                    setEditingDay(day)
                    setDayDialogOpen(true)
                  }}
                  onDelete={() => {
                    if (confirm("Delete this day and all its services?")) {
                      removeDay.mutate({
                        productId,
                        itineraryId: selectedItineraryId ?? undefined,
                        dayId: day.id,
                      })
                    }
                  }}
                  onAddService={() => {
                    setServiceDayId(day.id)
                    setEditingService(undefined)
                    setServiceDialogOpen(true)
                  }}
                  onEditService={(service) => {
                    setServiceDayId(day.id)
                    setEditingService(service)
                    setServiceDialogOpen(true)
                  }}
                  uploadMedia={uploadMedia}
                  renderDayMediaSection={renderDayMediaSection}
                />
              ))
            )}
          </>
        )}

        <ProductDayDialog
          open={dayDialogOpen}
          onOpenChange={setDayDialogOpen}
          productId={productId}
          day={editingDay}
          nextDayNumber={nextDayNumber}
          onSuccess={() => setEditingDay(undefined)}
        />
        <ProductDayServiceDialog
          open={serviceDialogOpen}
          onOpenChange={setServiceDialogOpen}
          productId={productId}
          dayId={serviceDayId}
          service={editingService}
          renderSupplierServicePicker={renderSupplierServicePicker}
          onSuccess={() => setEditingService(undefined)}
        />
        <ProductItineraryDialog
          open={itineraryDialogOpen}
          onOpenChange={(open) => {
            setItineraryDialogOpen(open)
            if (!open) setEditingItinerary(undefined)
          }}
          productId={productId}
          itinerary={editingItinerary}
          itineraryCount={itineraries.length}
          onSuccess={(itineraryId) => {
            if (!editingItinerary) setSelectedItineraryId(itineraryId)
          }}
        />
        <AlertDialog
          open={!!deleteItineraryTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteItineraryTarget(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete itinerary?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteItineraryTarget
                  ? `"${deleteItineraryTarget.name}" and all its days and services will be permanently removed.`
                  : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleConfirmDeleteItinerary()}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

function DayRow({
  productId,
  day,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddService,
  onEditService,
  uploadMedia,
  renderDayMediaSection,
}: {
  productId: string
  day: ProductDayRecord
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddService: () => void
  onEditService: (service: ProductDayServiceRecord) => void
  uploadMedia?: ProductMediaUploadHandler
  renderDayMediaSection?: (args: {
    productId: string
    day: ProductDayRecord
    defaultSection: React.ReactNode
  }) => React.ReactNode
}) {
  const { data, isPending, isError } = useProductDayServices(productId, day.id, {
    enabled: expanded,
  })
  const defaultDayMediaSection = (
    <ProductMediaSection
      productId={productId}
      dayId={day.id}
      title="Media"
      description="Manage media attached to this itinerary day."
      compact
      uploadMedia={uploadMedia}
    />
  )

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <div className="flex-1">
          <span className="text-sm font-medium">
            Day {day.dayNumber}
            {day.title ? `: ${day.title}` : ""}
          </span>
          {day.location ? (
            <span className="ml-2 text-xs text-muted-foreground">{day.location}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete}>
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-3 border-t bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Services
              </p>
              {day.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{day.description}</p>
              ) : null}
            </div>
            <Button variant="outline" size="sm" onClick={onAddService}>
              <Plus className="mr-2 size-3.5" aria-hidden="true" />
              Add service
            </Button>
          </div>

          {isPending ? (
            <div className="flex min-h-20 items-center justify-center rounded-md border bg-background">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Failed to load day services.</p>
          ) : !data?.data.length ? (
            <p className="rounded-md border bg-background px-3 py-4 text-sm text-muted-foreground">
              No services configured for this day.
            </p>
          ) : (
            <ServicesTable
              productId={productId}
              dayId={day.id}
              services={data.data}
              onEditService={onEditService}
            />
          )}

          {renderDayMediaSection
            ? renderDayMediaSection({
                productId,
                day,
                defaultSection: defaultDayMediaSection,
              })
            : defaultDayMediaSection}
        </div>
      ) : null}
    </div>
  )
}

function ServicesTable({
  productId,
  dayId,
  services,
  onEditService,
}: {
  productId: string
  dayId: string
  services: ProductDayServiceRecord[]
  onEditService: (service: ProductDayServiceRecord) => void
}) {
  const serviceMutation = useProductDayServiceMutation()
  const sorted = React.useMemo(
    () =>
      services
        .slice()
        .sort(
          (left, right) => (left.sortOrder ?? left.quantity) - (right.sortOrder ?? right.quantity),
        ),
    [services],
  )

  return (
    <div className="rounded-md border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((service) => (
            <TableRow key={service.id}>
              <TableCell>{service.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{serviceTypeLabels[service.serviceType]}</Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {(service.costAmountCents / 100).toFixed(2)} {service.costCurrency}
              </TableCell>
              <TableCell>{service.quantity}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => onEditService(service)}>
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (confirm("Delete this service?")) {
                        serviceMutation.remove.mutate({
                          productId,
                          dayId,
                          serviceId: service.id,
                        })
                      }
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
