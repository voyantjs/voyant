import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { productsQueryKeys, useProduct } from "@voyantjs/products-react"
import { ArrowLeft, History, Loader2, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { api } from "@/lib/api-client"
import { DayDialog } from "./product-day-dialog"
import { DepartureDialog, type DepartureSlot } from "./product-departure-dialog"
import { ProductDialog } from "./product-detail-dialog"
import {
  ProductDeparturesCard,
  ProductItineraryCard,
  ProductNotesCard,
  ProductSchedulesCard,
  ProductVersionsCard,
} from "./product-detail-sections"
import {
  type DayService,
  formatAmount,
  formatMargin,
  getProductDaysQueryOptions,
  getProductNotesQueryOptions,
  getProductRulesQueryOptions,
  getProductSlotsQueryOptions,
  getProductVersionsQueryOptions,
  type ProductDay,
  statusVariant,
} from "./product-detail-shared"
import { OptionsSection } from "./product-options-section"
import { type AvailabilityRule, ScheduleDialog } from "./product-schedule-dialog"
import { ServiceDialog } from "./product-service-dialog"
import { VersionDialog } from "./product-version-dialog"

export function ProductDetailPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [dayDialogOpen, setDayDialogOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<ProductDay | undefined>()
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [serviceDialogDayId, setServiceDialogDayId] = useState("")
  const [editingService, setEditingService] = useState<DayService | undefined>()
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [departureDialogOpen, setDepartureDialogOpen] = useState(false)
  const [editingDeparture, setEditingDeparture] = useState<DepartureSlot | undefined>()
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AvailabilityRule | undefined>()

  const { data: product, isPending } = useProduct(id)
  const { data: daysData, refetch: refetchDays } = useQuery(getProductDaysQueryOptions(id))
  const { data: versionsData, refetch: refetchVersions } = useQuery(
    getProductVersionsQueryOptions(id),
  )
  const { data: notesData, refetch: refetchNotes } = useQuery(getProductNotesQueryOptions(id))
  const { data: slotsData, refetch: refetchSlots } = useQuery(getProductSlotsQueryOptions(id))
  const { data: rulesData, refetch: refetchRules } = useQuery(getProductRulesQueryOptions(id))

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/products/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      void navigate({ to: "/products" })
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.post(`/v1/products/${id}/notes`, { content }),
    onSuccess: () => {
      setNoteContent("")
      void refetchNotes()
    },
  })

  const deleteDayMutation = useMutation({
    mutationFn: (dayId: string) => api.delete(`/v1/products/${id}/days/${dayId}`),
    onSuccess: () => {
      void refetchDays()
    },
  })

  const deleteServiceMutation = useMutation({
    mutationFn: ({ dayId, serviceId }: { dayId: string; serviceId: string }) =>
      api.delete(`/v1/products/${id}/days/${dayId}/services/${serviceId}`),
  })

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => api.delete(`/v1/availability/slots/${slotId}`),
    onSuccess: () => {
      void refetchSlots()
    },
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => api.delete(`/v1/availability/rules/${ruleId}`),
    onSuccess: () => {
      void refetchRules()
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/products" })}>
          Back to Products
        </Button>
      </div>
    )
  }

  const nextDayNumber = (daysData?.data.length ?? 0) + 1

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/products" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={statusVariant[product.status] ?? "secondary"} className="capitalize">
              {product.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setVersionDialogOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Create Version
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this product?")) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {product.description ? (
              <div>
                <span className="text-muted-foreground">Description:</span>{" "}
                <span>{product.description}</span>
              </div>
            ) : null}
            <div>
              <span className="text-muted-foreground">Sell Currency:</span>{" "}
              <span>{product.sellCurrency}</span>
            </div>
            {product.sellAmountCents != null ? (
              <div>
                <span className="text-muted-foreground">Sell Amount:</span>{" "}
                <span className="font-mono">
                  {formatAmount(product.sellAmountCents, product.sellCurrency)}
                </span>
              </div>
            ) : null}
            {product.costAmountCents != null ? (
              <div>
                <span className="text-muted-foreground">Cost Amount:</span>{" "}
                <span className="font-mono">
                  {formatAmount(product.costAmountCents, product.sellCurrency)}
                </span>
              </div>
            ) : null}
            {product.marginPercent != null ? (
              <div>
                <span className="text-muted-foreground">Margin:</span>{" "}
                <span className="font-mono">{formatMargin(product.marginPercent)}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              <span>{new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>{" "}
              <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-2 border-t pt-3 text-xs text-muted-foreground">
              Products are templates. Individual departures are managed in the Departures section
              below.
            </p>
          </CardContent>
        </Card>
      </div>

      <ProductDeparturesCard
        slots={slotsData?.data ?? []}
        onCreate={() => {
          setEditingDeparture(undefined)
          setDepartureDialogOpen(true)
        }}
        onEdit={(slot) => {
          setEditingDeparture(slot)
          setDepartureDialogOpen(true)
        }}
        onDelete={(slotId) => {
          if (confirm("Delete this departure?")) {
            deleteSlotMutation.mutate(slotId)
          }
        }}
      />

      <ProductSchedulesCard
        rules={rulesData?.data ?? []}
        onCreate={() => {
          setEditingSchedule(undefined)
          setScheduleDialogOpen(true)
        }}
        onEdit={(rule) => {
          setEditingSchedule(rule)
          setScheduleDialogOpen(true)
        }}
        onDelete={(ruleId) => {
          if (confirm("Delete this schedule?")) {
            deleteRuleMutation.mutate(ruleId)
          }
        }}
      />

      <ProductItineraryCard
        productId={id}
        days={daysData?.data ?? []}
        expandedDayId={expandedDayId}
        onToggleDay={(dayId) => setExpandedDayId(expandedDayId === dayId ? null : dayId)}
        onCreateDay={() => {
          setEditingDay(undefined)
          setDayDialogOpen(true)
        }}
        onEditDay={(day) => {
          setEditingDay(day)
          setDayDialogOpen(true)
        }}
        onDeleteDay={(dayId) => {
          if (confirm("Delete this day and all its services?")) {
            deleteDayMutation.mutate(dayId)
          }
        }}
        onAddService={(dayId) => {
          setServiceDialogDayId(dayId)
          setEditingService(undefined)
          setServiceDialogOpen(true)
        }}
        onEditService={(dayId, service) => {
          setServiceDialogDayId(dayId)
          setEditingService(service)
          setServiceDialogOpen(true)
        }}
        onDeleteService={(dayId, serviceId) => {
          if (confirm("Delete this service?")) {
            deleteServiceMutation.mutate(
              { dayId, serviceId },
              {
                onSuccess: () => {
                  void queryClient.invalidateQueries({
                    queryKey: ["product-day-services", id, dayId],
                  })
                },
              },
            )
          }
        }}
      />

      <OptionsSection productId={id} />
      <ProductVersionsCard versions={versionsData?.data ?? []} />
      <ProductNotesCard
        noteContent={noteContent}
        setNoteContent={setNoteContent}
        isAdding={addNoteMutation.isPending}
        onAddNote={() => addNoteMutation.mutate(noteContent.trim())}
        notes={notesData?.data ?? []}
      />

      <ProductDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        product={product}
        onSuccess={() => {
          setEditOpen(false)
          void queryClient.invalidateQueries({ queryKey: productsQueryKeys.product(id) })
          void queryClient.invalidateQueries({ queryKey: productsQueryKeys.products() })
        }}
      />
      <DayDialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        productId={id}
        day={editingDay}
        nextDayNumber={nextDayNumber}
        onSuccess={() => {
          setDayDialogOpen(false)
          setEditingDay(undefined)
          void refetchDays()
        }}
      />
      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        productId={id}
        dayId={serviceDialogDayId}
        service={editingService}
        onSuccess={() => {
          setServiceDialogOpen(false)
          setEditingService(undefined)
          void queryClient.invalidateQueries({
            queryKey: ["product-day-services", id, serviceDialogDayId],
          })
        }}
      />
      <VersionDialog
        open={versionDialogOpen}
        onOpenChange={setVersionDialogOpen}
        productId={id}
        onSuccess={() => {
          setVersionDialogOpen(false)
          void refetchVersions()
        }}
      />
      <DepartureDialog
        open={departureDialogOpen}
        onOpenChange={setDepartureDialogOpen}
        productId={id}
        slot={editingDeparture}
        onSuccess={() => {
          setDepartureDialogOpen(false)
          setEditingDeparture(undefined)
          void refetchSlots()
        }}
      />
      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        productId={id}
        rule={editingSchedule}
        onSuccess={() => {
          setScheduleDialogOpen(false)
          setEditingSchedule(undefined)
          void refetchRules()
        }}
      />
    </div>
  )
}
