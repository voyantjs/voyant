import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { productsQueryKeys, useProduct, useProductItineraries } from "@voyantjs/products-react"
import { useState } from "react"
import { Button } from "@/components/ui"
import { useAdminMessages } from "@/lib/admin-i18n"
import { api } from "@/lib/api-client"
import { QuickBookDialog } from "../bookings/quick-book-dialog"
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
  getChannelsQueryOptions,
  getProductChannelMappingsQueryOptions,
  getProductMediaQueryOptions,
  getProductRulesQueryOptions,
  getProductSlotsQueryOptions,
} from "./product-detail-shared"
import { ProductDetailSkeleton } from "./product-detail-skeleton"
import { OptionsSection } from "./product-options-section"
import { type AvailabilityRule, ScheduleDialog } from "./product-schedule-dialog"

// ---------- Main page ----------

export function ProductDetailPage({ id }: { id: string }) {
  const messages = useAdminMessages()
  const productMessages = messages.products.core
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [quickBookOpen, setQuickBookOpen] = useState(false)
  const [departureDialogOpen, setDepartureDialogOpen] = useState(false)
  const [editingDeparture, setEditingDeparture] = useState<DepartureSlot | undefined>()
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AvailabilityRule | undefined>()

  const { data: product, isPending } = useProduct(id)
  const itineraryQuery = useProductItineraries(id)

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

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => api.delete(`/v1/availability/slots/${slotId}`),
    onSuccess: () => void refetchSlots(),
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => api.delete(`/v1/availability/rules/${ruleId}`),
    onSuccess: () => void refetchRules(),
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
      if (!uploadRes.ok) throw new Error(productMessages.uploadFailed)
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
    return <ProductDetailSkeleton />
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">{productMessages.detailNotFound}</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/products" })}>
          {productMessages.backToProducts}
        </Button>
      </div>
    )
  }

  const slots = slotsData?.data ?? []
  const rules = rulesData?.data ?? []
  const itineraryNameById = new Map(
    (itineraryQuery.data?.data ?? []).map((itinerary) => [itinerary.id, itinerary.name] as const),
  )
  return (
    <div className="flex flex-col gap-6 p-6">
      <ProductDetailHeader
        product={product}
        isDeleting={deleteMutation.isPending}
        onEdit={() => setEditOpen(true)}
        onAddBooking={() => setQuickBookOpen(true)}
        onDelete={() => {
          if (confirm(productMessages.deleteConfirm)) {
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

          {/* Media */}
          <ProductMediaSection
            productId={id}
            media={mediaData?.data ?? []}
            isUploading={uploadMediaMutation.isPending}
            onUpload={(file) => uploadMediaMutation.mutate({ file })}
            onSetCover={(mediaId) => setCoverMutation.mutate(mediaId)}
            onDelete={(mediaId) => {
              if (confirm(productMessages.deleteMediaConfirm)) {
                deleteMediaMutation.mutate(mediaId)
              }
            }}
          />

          {/* Departures */}
          <ProductDeparturesSection
            slots={slots}
            itineraryNameById={itineraryNameById}
            onCreate={() => {
              setEditingDeparture(undefined)
              setDepartureDialogOpen(true)
            }}
            onEdit={(slot) => {
              setEditingDeparture(slot)
              setDepartureDialogOpen(true)
            }}
            onDelete={(slotId) => {
              if (confirm(productMessages.deleteDepartureConfirm)) {
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
              if (confirm(productMessages.deleteScheduleConfirm)) {
                deleteRuleMutation.mutate(ruleId)
              }
            }}
          />

          {/* Itinerary */}
          <ProductDetailItinerarySection productId={id} />

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
        </div>
      </div>

      {/* Dialogs */}
      <QuickBookDialog
        open={quickBookOpen}
        onOpenChange={setQuickBookOpen}
        defaultProductId={id}
        onCreated={(booking) => {
          setQuickBookOpen(false)
          void navigate({ to: "/bookings/$id", params: { id: booking.id } })
        }}
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
