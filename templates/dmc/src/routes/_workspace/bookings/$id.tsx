import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Activity,
  ArrowLeft,
  Clock,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { useState } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@/components/ui"

import { api } from "@/lib/api-client"

import { BookingDialog } from "./_components/booking-dialog"
import { PassengerDialog } from "./_components/passenger-dialog"
import { StatusChangeDialog } from "./_components/status-change-dialog"
import { SupplierStatusDialog } from "./_components/supplier-status-dialog"

type BookingDetail = {
  id: string
  bookingNumber: string
  status: "draft" | "confirmed" | "in_progress" | "completed" | "cancelled"
  personId: string | null
  organizationId: string | null
  sellCurrency: string
  sellAmountCents: number | null
  costAmountCents: number | null
  marginPercent: number | null
  startDate: string | null
  endDate: string | null
  pax: number | null
  internalNotes: string | null
  createdAt: string
  updatedAt: string
}

type Passenger = {
  id: string
  bookingId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  specialRequests: string | null
  createdAt: string
}

type SupplierStatus = {
  id: string
  bookingId: string
  supplierServiceId: string | null
  serviceName: string
  status: "pending" | "confirmed" | "rejected" | "cancelled"
  supplierReference: string | null
  costCurrency: string
  costAmountCents: number
  notes: string | null
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
}

type ActivityEntry = {
  id: string
  bookingId: string
  actorId: string | null
  activityType: string
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

type BookingNote = {
  id: string
  bookingId: string
  authorId: string
  content: string
  createdAt: string
}

export const Route = createFileRoute("/_workspace/bookings/$id")({
  component: BookingDetailPage,
})

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  confirmed: "default",
  in_progress: "secondary",
  completed: "default",
  cancelled: "destructive",
}

const supplierStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  confirmed: "default",
  rejected: "destructive",
  cancelled: "secondary",
}

function formatAmount(cents: number | null, currency: string): string {
  if (cents == null) return "-"
  return `${(cents / 100).toFixed(2)} ${currency}`
}

function formatMargin(percent: number | null): string {
  if (percent == null) return "-"
  return `${(percent / 100).toFixed(2)}%`
}

function formatStatus(status: string): string {
  return status.replace("_", " ")
}

const activityIcons: Record<string, typeof Activity> = {
  booking_created: Plus,
  booking_converted: RefreshCw,
  status_change: Clock,
  supplier_update: RefreshCw,
  passenger_update: UserPlus,
  note_added: Pencil,
}

function BookingDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [passengerDialogOpen, setPassengerDialogOpen] = useState(false)
  const [editingPassenger, setEditingPassenger] = useState<Passenger | undefined>()
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [editingSupplierStatus, setEditingSupplierStatus] = useState<SupplierStatus | undefined>()

  const { data: bookingData, isPending } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.get<{ data: BookingDetail }>(`/v1/bookings/${id}`),
  })

  const { data: passengersData, refetch: refetchPassengers } = useQuery({
    queryKey: ["booking-passengers", id],
    queryFn: () => api.get<{ data: Passenger[] }>(`/v1/bookings/${id}/passengers`),
  })

  const { data: supplierStatusesData, refetch: refetchSupplierStatuses } = useQuery({
    queryKey: ["booking-supplier-statuses", id],
    queryFn: () => api.get<{ data: SupplierStatus[] }>(`/v1/bookings/${id}/supplier-statuses`),
  })

  const { data: activityData, refetch: refetchActivity } = useQuery({
    queryKey: ["booking-activity", id],
    queryFn: () => api.get<{ data: ActivityEntry[] }>(`/v1/bookings/${id}/activity`),
  })

  const { data: notesData, refetch: refetchNotes } = useQuery({
    queryKey: ["booking-notes", id],
    queryFn: () => api.get<{ data: BookingNote[] }>(`/v1/bookings/${id}/notes`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/bookings/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] })
      void navigate({ to: "/bookings" })
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.post(`/v1/bookings/${id}/notes`, { content }),
    onSuccess: () => {
      setNoteContent("")
      void refetchNotes()
      void refetchActivity()
    },
  })

  const deletePassengerMutation = useMutation({
    mutationFn: (passengerId: string) => api.delete(`/v1/bookings/${id}/passengers/${passengerId}`),
    onSuccess: () => {
      void refetchPassengers()
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const booking = bookingData?.data
  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Booking not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/bookings" })}>
          Back to Bookings
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/bookings" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{booking.bookingNumber}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant[booking.status] ?? "secondary"} className="capitalize">
              {formatStatus(booking.status)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setStatusDialogOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Change Status
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this booking?")) {
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
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Sell Currency:</span>{" "}
              <span>{booking.sellCurrency}</span>
            </div>
            {booking.sellAmountCents != null && (
              <div>
                <span className="text-muted-foreground">Sell Amount:</span>{" "}
                <span className="font-mono">
                  {formatAmount(booking.sellAmountCents, booking.sellCurrency)}
                </span>
              </div>
            )}
            {booking.costAmountCents != null && (
              <div>
                <span className="text-muted-foreground">Cost Amount:</span>{" "}
                <span className="font-mono">
                  {formatAmount(booking.costAmountCents, booking.sellCurrency)}
                </span>
              </div>
            )}
            {booking.marginPercent != null && (
              <div>
                <span className="text-muted-foreground">Margin:</span>{" "}
                <span className="font-mono">{formatMargin(booking.marginPercent)}</span>
              </div>
            )}
            {booking.pax && (
              <div>
                <span className="text-muted-foreground">Travelers:</span> <span>{booking.pax}</span>
              </div>
            )}
            {booking.internalNotes && (
              <div className="border-t pt-3 mt-2">
                <span className="text-muted-foreground">Internal Notes:</span>
                <p className="mt-1 whitespace-pre-wrap">{booking.internalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dates & Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Start Date:</span>{" "}
              <span>{booking.startDate ?? "TBD"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">End Date:</span>{" "}
              <span>{booking.endDate ?? "TBD"}</span>
            </div>
            {booking.personId && (
              <div>
                <span className="text-muted-foreground">Person:</span>{" "}
                <span className="font-mono text-xs">{booking.personId}</span>
              </div>
            )}
            {booking.organizationId && (
              <div>
                <span className="text-muted-foreground">Organization:</span>{" "}
                <span className="font-mono text-xs">{booking.organizationId}</span>
              </div>
            )}
            <div className="border-t pt-3 mt-2">
              <div>
                <span className="text-muted-foreground">Created:</span>{" "}
                <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>{" "}
                <span>{new Date(booking.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Passengers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Passengers
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingPassenger(undefined)
              setPassengerDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Passenger
          </Button>
        </CardHeader>
        <CardContent>
          {(!passengersData?.data || passengersData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No passengers yet.</p>
          )}

          {passengersData?.data && passengersData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Email</th>
                    <th className="text-left p-2 font-medium">Phone</th>
                    <th className="p-2 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {passengersData.data.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="p-2">
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="p-2">{p.email ?? "-"}</td>
                      <td className="p-2">{p.phone ?? "-"}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPassenger(p)
                              setPassengerDialogOpen(true)
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Delete this passenger?")) {
                                deletePassengerMutation.mutate(p.id)
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Confirmations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Supplier Confirmations</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingSupplierStatus(undefined)
              setSupplierDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </CardHeader>
        <CardContent>
          {(!supplierStatusesData?.data || supplierStatusesData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No supplier statuses yet.
            </p>
          )}

          {supplierStatusesData?.data && supplierStatusesData.data.length > 0 && (
            <div className="rounded border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-2 font-medium">Service</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Cost</th>
                    <th className="text-left p-2 font-medium">Reference</th>
                    <th className="text-left p-2 font-medium">Confirmed</th>
                    <th className="p-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {supplierStatusesData.data.map((ss) => (
                    <tr key={ss.id} className="border-b last:border-b-0">
                      <td className="p-2">{ss.serviceName}</td>
                      <td className="p-2">
                        <Badge
                          variant={supplierStatusVariant[ss.status] ?? "secondary"}
                          className="capitalize text-xs"
                        >
                          {ss.status}
                        </Badge>
                      </td>
                      <td className="p-2 font-mono">
                        {(ss.costAmountCents / 100).toFixed(2)} {ss.costCurrency}
                      </td>
                      <td className="p-2">{ss.supplierReference ?? "-"}</td>
                      <td className="p-2">
                        {ss.confirmedAt ? new Date(ss.confirmedAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSupplierStatus(ss)
                            setSupplierDialogOpen(true)
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!activityData?.data || activityData.data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No activity yet.</p>
          )}

          <div className="flex flex-col gap-3">
            {activityData?.data.map((entry) => {
              const Icon = activityIcons[entry.activityType] ?? Activity
              return (
                <div key={entry.id} className="flex items-start gap-3 rounded-md border p-3">
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.actorId && entry.actorId !== "system" ? `By ${entry.actorId} - ` : ""}
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
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
      <BookingDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        booking={booking}
        onSuccess={() => {
          setEditOpen(false)
          void queryClient.invalidateQueries({ queryKey: ["booking", id] })
          void queryClient.invalidateQueries({ queryKey: ["bookings"] })
        }}
      />

      <StatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        bookingId={id}
        currentStatus={booking.status}
        onSuccess={() => {
          setStatusDialogOpen(false)
          void queryClient.invalidateQueries({ queryKey: ["booking", id] })
          void queryClient.invalidateQueries({ queryKey: ["bookings"] })
          void refetchActivity()
        }}
      />

      <PassengerDialog
        open={passengerDialogOpen}
        onOpenChange={setPassengerDialogOpen}
        bookingId={id}
        passenger={editingPassenger}
        onSuccess={() => {
          setPassengerDialogOpen(false)
          setEditingPassenger(undefined)
          void refetchPassengers()
          void refetchActivity()
        }}
      />

      <SupplierStatusDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        bookingId={id}
        supplierStatus={editingSupplierStatus}
        onSuccess={() => {
          setSupplierDialogOpen(false)
          setEditingSupplierStatus(undefined)
          void refetchSupplierStatuses()
          void refetchActivity()
        }}
      />
    </div>
  )
}
