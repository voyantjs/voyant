import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@/components/ui"
import { api } from "@/lib/api-client"
import { RateDialog } from "./_components/rate-dialog"
import { ServiceDialog } from "./_components/service-dialog"
import { SupplierDialog } from "./_components/supplier-dialog"
import { ServiceRow } from "./$id-service-row"
import {
  getSupplierNotesQueryOptions,
  getSupplierQueryOptions,
  getSupplierServicesQueryOptions,
  type SupplierRate,
  type SupplierService,
  statusVariant,
} from "./$id-shared"

export function SupplierDetailPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<SupplierService | undefined>()
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  const [rateDialogOpen, setRateDialogOpen] = useState(false)
  const [rateDialogServiceId, setRateDialogServiceId] = useState("")
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/suppliers" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
          <div className="mt-1 flex items-center gap-2">
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
            <div className="mt-2 border-t pt-3">
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
            <p className="py-4 text-center text-sm text-muted-foreground">No services yet.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note..."
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              className="min-h-[80px]"
            />
            <Button
              className="self-end"
              disabled={!noteContent.trim() || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate(noteContent.trim())}
            >
              {addNoteMutation.isPending ? "Saving..." : "Add"}
            </Button>
          </div>

          {notesData?.data.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No notes yet.</p>
          )}

          {notesData?.data.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <p className="whitespace-pre-wrap text-sm">{note.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

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
