import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@/components/ui"

import { api } from "@/lib/api-client"

import { RateDialog } from "./_components/rate-dialog"
import { ServiceDialog } from "./_components/service-dialog"
import { SupplierDialog } from "./_components/supplier-dialog"

type Supplier = {
  id: string
  name: string
  type: "hotel" | "transfer" | "guide" | "experience" | "airline" | "restaurant" | "other"
  status: "active" | "inactive" | "pending"
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
  defaultCurrency: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

type SupplierService = {
  id: string
  supplierId: string
  serviceType: "accommodation" | "transfer" | "experience" | "guide" | "meal" | "other"
  name: string
  description: string | null
  duration: string | null
  capacity: number | null
  active: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

type SupplierRate = {
  id: string
  serviceId: string
  name: string
  currency: string
  amountCents: number
  unit: "per_person" | "per_group" | "per_night" | "per_vehicle" | "flat"
  validFrom: string | null
  validTo: string | null
  minPax: number | null
  maxPax: number | null
  notes: string | null
  createdAt: string
}

type SupplierNote = {
  id: string
  supplierId: string
  authorId: string
  content: string
  createdAt: string
}

function getSupplierQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["supplier", id],
    queryFn: () => api.get<{ data: Supplier }>(`/v1/suppliers/${id}`),
  })
}

function getSupplierServicesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["supplier-services", id],
    queryFn: () => api.get<{ data: SupplierService[] }>(`/v1/suppliers/${id}/services`),
  })
}

function getSupplierNotesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["supplier-notes", id],
    queryFn: () => api.get<{ data: SupplierNote[] }>(`/v1/suppliers/${id}/notes`),
  })
}

export const Route = createFileRoute("/_workspace/suppliers/$id")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getSupplierQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getSupplierServicesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getSupplierNotesQueryOptions(params.id)),
    ]),
  component: SupplierDetailPage,
})

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
}

function formatAmount(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

function formatUnit(unit: string): string {
  return unit.replace(/_/g, " ")
}

function SupplierDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<SupplierService | undefined>()
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  const [rateDialogOpen, setRateDialogOpen] = useState(false)
  const [rateDialogServiceId, setRateDialogServiceId] = useState<string>("")
  const [editingRate, setEditingRate] = useState<SupplierRate | undefined>()

  const { data: supplierData, isPending } = useQuery(getSupplierQueryOptions(id))

  const { data: servicesData, refetch: refetchServices } = useQuery(
    getSupplierServicesQueryOptions(id),
  )

  const { data: notesData, refetch: refetchNotes } = useQuery(getSupplierNotesQueryOptions(id))

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/suppliers/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      void navigate({ to: "/suppliers" })
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.post(`/v1/suppliers/${id}/notes`, { content }),
    onSuccess: () => {
      setNoteContent("")
      void refetchNotes()
    },
  })

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId: string) => api.delete(`/v1/suppliers/${id}/services/${serviceId}`),
    onSuccess: () => {
      void refetchServices()
    },
  })

  const deleteRateMutation = useMutation({
    mutationFn: ({ serviceId, rateId }: { serviceId: string; rateId: string }) =>
      api.delete(`/v1/suppliers/${id}/services/${serviceId}/rates/${rateId}`),
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const supplier = supplierData?.data
  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Supplier not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/suppliers" })}>
          Back to Suppliers
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/suppliers" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize">
              {supplier.type}
            </Badge>
            <Badge variant={statusVariant[supplier.status] ?? "secondary"} className="capitalize">
              {supplier.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this supplier?")) {
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

      {/* Info cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {supplier.description && (
              <div>
                <span className="text-muted-foreground">Description:</span>{" "}
                <span>{supplier.description}</span>
              </div>
            )}
            {supplier.email && (
              <div>
                <span className="text-muted-foreground">Email:</span> <span>{supplier.email}</span>
              </div>
            )}
            {supplier.phone && (
              <div>
                <span className="text-muted-foreground">Phone:</span> <span>{supplier.phone}</span>
              </div>
            )}
            {supplier.website && (
              <div>
                <span className="text-muted-foreground">Website:</span>{" "}
                <span>{supplier.website}</span>
              </div>
            )}
            {supplier.address && (
              <div>
                <span className="text-muted-foreground">Address:</span>{" "}
                <span>{supplier.address}</span>
              </div>
            )}
            {supplier.city && (
              <div>
                <span className="text-muted-foreground">City:</span> <span>{supplier.city}</span>
              </div>
            )}
            {supplier.country && (
              <div>
                <span className="text-muted-foreground">Country:</span>{" "}
                <span>{supplier.country}</span>
              </div>
            )}
            {supplier.defaultCurrency && (
              <div>
                <span className="text-muted-foreground">Default Currency:</span>{" "}
                <span>{supplier.defaultCurrency}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Primary Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {supplier.contactName && (
              <div>
                <span className="text-muted-foreground">Name:</span>{" "}
                <span>{supplier.contactName}</span>
              </div>
            )}
            {supplier.contactEmail && (
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span>{supplier.contactEmail}</span>
              </div>
            )}
            {supplier.contactPhone && (
              <div>
                <span className="text-muted-foreground">Phone:</span>{" "}
                <span>{supplier.contactPhone}</span>
              </div>
            )}
            {!supplier.contactName && !supplier.contactEmail && !supplier.contactPhone && (
              <p className="text-muted-foreground">No contact information.</p>
            )}
            <div className="border-t pt-3 mt-2">
              <div>
                <span className="text-muted-foreground">Created:</span>{" "}
                <span>{new Date(supplier.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>{" "}
                <span>{new Date(supplier.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Services</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingService(undefined)
              setServiceDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </CardHeader>
        <CardContent>
          {(!servicesData?.data || servicesData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No services yet.</p>
          )}

          <div className="flex flex-col gap-2">
            {servicesData?.data.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                supplierId={id}
                expanded={expandedServiceId === service.id}
                onToggle={() =>
                  setExpandedServiceId(expandedServiceId === service.id ? null : service.id)
                }
                onEdit={() => {
                  setEditingService(service)
                  setServiceDialogOpen(true)
                }}
                onDelete={() => {
                  if (confirm("Delete this service and all its rates?")) {
                    deleteServiceMutation.mutate(service.id)
                  }
                }}
                onAddRate={() => {
                  setRateDialogServiceId(service.id)
                  setEditingRate(undefined)
                  setRateDialogOpen(true)
                }}
                onEditRate={(rate) => {
                  setRateDialogServiceId(service.id)
                  setEditingRate(rate)
                  setRateDialogOpen(true)
                }}
                onDeleteRate={(rateId) => {
                  if (confirm("Delete this rate?")) {
                    deleteRateMutation.mutate(
                      { serviceId: service.id, rateId },
                      { onSuccess: () => void refetchServices() },
                    )
                  }
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              className="self-end"
              disabled={!noteContent.trim() || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate(noteContent.trim())}
            >
              {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>

          {notesData?.data.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No notes yet.</p>
          )}

          {notesData?.data.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SupplierDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        supplier={supplier}
        onSuccess={() => {
          setEditOpen(false)
          void queryClient.invalidateQueries({ queryKey: ["supplier", id] })
          void queryClient.invalidateQueries({ queryKey: ["suppliers"] })
        }}
      />

      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        supplierId={id}
        service={editingService}
        onSuccess={() => {
          setServiceDialogOpen(false)
          setEditingService(undefined)
          void refetchServices()
        }}
      />

      <RateDialog
        open={rateDialogOpen}
        onOpenChange={setRateDialogOpen}
        supplierId={id}
        serviceId={rateDialogServiceId}
        rate={editingRate}
        onSuccess={() => {
          setRateDialogOpen(false)
          setEditingRate(undefined)
          void refetchServices()
        }}
      />
    </div>
  )
}

// ---------- Service row with expandable rates ----------

function ServiceRow({
  service,
  supplierId,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddRate,
  onEditRate,
  onDeleteRate,
}: {
  service: SupplierService
  supplierId: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddRate: () => void
  onEditRate: (rate: SupplierRate) => void
  onDeleteRate: (rateId: string) => void
}) {
  const { data: ratesData } = useQuery({
    queryKey: ["supplier-service-rates", supplierId, service.id],
    queryFn: () =>
      api.get<{ data: SupplierRate[] }>(`/v1/suppliers/${supplierId}/services/${service.id}/rates`),
    enabled: expanded,
  })

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <span className="text-sm font-medium">{service.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs capitalize">
              {service.serviceType}
            </Badge>
            {service.duration && (
              <span className="text-xs text-muted-foreground">{service.duration}</span>
            )}
            {service.capacity && (
              <span className="text-xs text-muted-foreground">max {service.capacity} pax</span>
            )}
            {!service.active && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Rates
            </p>
            <Button variant="outline" size="sm" onClick={onAddRate}>
              <Plus className="mr-1 h-3 w-3" />
              Add Rate
            </Button>
          </div>

          {(!ratesData?.data || ratesData.data.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-2">No rates yet.</p>
          )}

          {ratesData?.data && ratesData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Amount</th>
                    <th className="text-left p-2 font-medium">Unit</th>
                    <th className="text-left p-2 font-medium">Valid</th>
                    <th className="text-left p-2 font-medium">Pax</th>
                    <th className="p-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {ratesData.data.map((rate) => (
                    <tr key={rate.id} className="border-b last:border-b-0">
                      <td className="p-2">{rate.name}</td>
                      <td className="p-2 font-mono">
                        {formatAmount(rate.amountCents, rate.currency)}
                      </td>
                      <td className="p-2 capitalize">{formatUnit(rate.unit)}</td>
                      <td className="p-2">
                        {rate.validFrom || rate.validTo
                          ? `${rate.validFrom ?? "..."} — ${rate.validTo ?? "..."}`
                          : "-"}
                      </td>
                      <td className="p-2">
                        {rate.minPax || rate.maxPax
                          ? `${rate.minPax ?? "?"}-${rate.maxPax ?? "?"}`
                          : "-"}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditRate(rate)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRate(rate.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
