import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { productsQueryKeys, useProduct } from "@voyantjs/products-react"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui"

import { api } from "@/lib/api-client"
import { DayDialog } from "./product-day-dialog"
import { DepartureDialog, type DepartureSlot } from "./product-departure-dialog"
import { ProductDialog } from "./product-detail-dialog"
import { ProductDetailHeader } from "./product-detail-header"
import { ProductDetailItinerarySection } from "./product-detail-itinerary-section"
import {
  ProductChannelsSection,
  ProductDeparturesSection,
  ProductDetailsSection,
  ProductMediaSection,
  ProductOrganizeSection,
  ProductSchedulesSection,
} from "./product-detail-sections"
import {
  type DayService,
  getChannelsQueryOptions,
  getProductChannelMappingsQueryOptions,
  getProductDaysQueryOptions,
  getProductMediaQueryOptions,
  getProductRulesQueryOptions,
  getProductSlotsQueryOptions,
  type ProductDay,
} from "./product-detail-shared"
import { OptionsSection } from "./product-options-section"
import { type AvailabilityRule, ScheduleDialog } from "./product-schedule-dialog"
import { ServiceDialog } from "./product-service-dialog"

// ---------- Main page ----------

export function ProductDetailPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [dayDialogOpen, setDayDialogOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<ProductDay | undefined>()
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [serviceDialogDayId, setServiceDialogDayId] = useState<string>("")
  const [editingService, setEditingService] = useState<DayService | undefined>()
  const [departureDialogOpen, setDepartureDialogOpen] = useState(false)
  const [editingDeparture, setEditingDeparture] = useState<DepartureSlot | undefined>()
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AvailabilityRule | undefined>()

  const { data: product, isPending } = useProduct(id)

  const { data: daysData, refetch: refetchDays } = useQuery(getProductDaysQueryOptions(id))

  const { data: slotsData, refetch: refetchSlots } = useQuery(getProductSlotsQueryOptions(id))

  const { data: rulesData, refetch: refetchRules } = useQuery(getProductRulesQueryOptions(id))

  const { data: allChannelsData } = useQuery(getChannelsQueryOptions())

  const { data: productMappingsData, refetch: refetchMappings } = useQuery(
    getProductChannelMappingsQueryOptions(id),
  )

  const { data: mediaData, refetch: refetchMedia } = useQuery(getProductMediaQueryOptions(id))

  const addChannelMappingMutation = useMutation({
    mutationFn: (channelId: string) =>
      api.post("/v1/distribution/product-mappings", {
        channelId,
        productId: id,
        active: true,
      }),
    onSuccess: () => void refetchMappings(),
  })

  const removeChannelMappingMutation = useMutation({
    mutationFn: (mappingId: string) => api.delete(`/v1/distribution/product-mappings/${mappingId}`),
    onSuccess: () => void refetchMappings(),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/products/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      void navigate({ to: "/products" })
    },
  })

  const deleteDayMutation = useMutation({
    mutationFn: (dayId: string) => api.delete(`/v1/products/${id}/days/${dayId}`),
    onSuccess: () => void refetchDays(),
  })

  const deleteServiceMutation = useMutation({
    mutationFn: ({ dayId, serviceId }: { dayId: string; serviceId: string }) =>
      api.delete(`/v1/products/${id}/days/${dayId}/services/${serviceId}`),
  })

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => api.delete(`/v1/availability/slots/${slotId}`),
    onSuccess: () => void refetchSlots(),
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => api.delete(`/v1/availability/rules/${ruleId}`),
    onSuccess: () => void refetchRules(),
  })

  const convertToBookingMutation = useMutation({
    mutationFn: () => {
      const now = new Date()
      const y = now.getFullYear().toString().slice(-2)
      const m = String(now.getMonth() + 1).padStart(2, "0")
      const seq = String(Math.floor(Math.random() * 9000) + 1000)
      return api.post<{ data: { id: string } }>("/v1/bookings/from-product", {
        productId: id,
        bookingNumber: `BK-${y}${m}-${seq}`,
      })
    },
    onSuccess: (result) => {
      void navigate({ to: "/bookings/$id", params: { id: result.data.id } })
    },
  })

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ file, dayId }: { file: File; dayId?: string }) => {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/v1/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const upload = (await uploadRes.json()) as {
        key: string
        url: string
        mimeType: string
        size: number
      }

      const mediaType = upload.mimeType.startsWith("video/")
        ? "video"
        : upload.mimeType.startsWith("image/")
          ? "image"
          : "document"

      const endpoint = dayId ? `/v1/products/${id}/days/${dayId}/media` : `/v1/products/${id}/media`

      return api.post(endpoint, {
        mediaType,
        name: file.name,
        url: upload.url,
        storageKey: upload.key,
        mimeType: upload.mimeType,
        fileSize: upload.size,
      })
    },
    onSuccess: () => void refetchMedia(),
  })

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) => api.delete(`/v1/products/media/${mediaId}`),
    onSuccess: () => void refetchMedia(),
  })

  const setCoverMutation = useMutation({
    mutationFn: (mediaId: string) => api.patch(`/v1/products/media/${mediaId}/set-cover`, {}),
    onSuccess: () => void refetchMedia(),
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
  const slots = slotsData?.data ?? []
  const rules = rulesData?.data ?? []
  const days = daysData?.data ?? []
  return (
    <div className="flex flex-col gap-6 p-6">
      <ProductDetailHeader
        product={product}
        isConvertingToBooking={convertToBookingMutation.isPending}
        isDeleting={deleteMutation.isPending}
        onEdit={() => setEditOpen(true)}
        onConvertToBooking={() => {
          if (confirm("Convert this product to a booking?")) {
            convertToBookingMutation.mutate()
          }
        }}
        onDelete={() => {
          if (confirm("Are you sure you want to delete this product?")) {
            deleteMutation.mutate()
          }
        }}
      />

      {/* Content — two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Left column (main) ── */}
        <div className="flex flex-col gap-6">
          {/* Product Details */}
          <ProductDetailsSection product={product} onEdit={() => setEditOpen(true)} />

          {/* Departures */}
          <ProductDeparturesSection
            slots={slots}
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

          {/* Recurring Schedules */}
          <ProductSchedulesSection
            rules={rules}
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

          {/* Itinerary */}
          <ProductDetailItinerarySection
            productId={id}
            days={days}
            expandedDayId={expandedDayId}
            onExpandedDayIdChange={setExpandedDayId}
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
            onUploadMedia={(dayId, file) =>
              uploadMediaMutation.mutate(
                { file, dayId },
                {
                  onSuccess: () =>
                    void queryClient.invalidateQueries({
                      queryKey: ["day-media", id, dayId],
                    }),
                },
              )
            }
            isUploadingMedia={uploadMediaMutation.isPending}
          />

          {/* Options */}
          <OptionsSection productId={id} />
        </div>

        {/* ── Right column (sidebar) ── */}
        <div className="flex flex-col gap-6">
          {/* Sales Channels */}
          <ProductChannelsSection
            allChannels={allChannelsData?.data ?? []}
            mappings={productMappingsData?.data ?? []}
            onAddChannel={(channelId) => addChannelMappingMutation.mutate(channelId)}
            onRemoveChannel={(mappingId) => removeChannelMappingMutation.mutate(mappingId)}
          />

          {/* Organize */}
          <ProductOrganizeSection product={product} onEdit={() => setEditOpen(true)} />

          {/* Media */}
          <ProductMediaSection
            media={mediaData?.data ?? []}
            isUploading={uploadMediaMutation.isPending}
            onUpload={(file) => uploadMediaMutation.mutate({ file })}
            onSetCover={(mediaId) => setCoverMutation.mutate(mediaId)}
            onDelete={(mediaId) => {
              if (confirm("Delete this media?")) {
                deleteMediaMutation.mutate(mediaId)
              }
            }}
          />
        </div>
      </div>

      {/* Dialogs */}
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
