import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, CalendarDays, Loader2, Package, Trash2, Truck, Wrench } from "lucide-react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { api } from "@/lib/api-client"

type SlotDetail = {
  id: string
  productId: string
  availabilityRuleId: string | null
  startTimeId: string | null
  dateLocal: string
  startsAt: string
  endsAt: string | null
  timezone: string
  status: "open" | "closed" | "sold_out" | "cancelled"
  unlimited: boolean
  initialPax: number | null
  remainingPax: number | null
  initialPickups: number | null
  remainingPickups: number | null
  remainingResources: number | null
  pastCutoff: boolean
  tooEarly: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

type Product = {
  id: string
  name: string
}

type SlotPickup = {
  id: string
  slotId: string
  pickupPointId: string
  initialCapacity: number | null
  remainingCapacity: number | null
}

type PickupPoint = {
  id: string
  name: string
  locationText: string | null
}

type Closeout = {
  id: string
  dateLocal: string
  reason: string | null
  createdBy: string | null
}

type Assignment = {
  id: string
  poolId: string | null
  resourceId: string | null
  bookingId: string | null
  status: "reserved" | "assigned" | "released" | "cancelled" | "completed"
  assignedBy: string | null
  releasedAt: string | null
  notes: string | null
}

type Resource = {
  id: string
  name: string
}

type Booking = {
  id: string
  bookingNumber: string
}

type ListResponse<T> = {
  data: T[]
  total: number
  limit: number
  offset: number
}

export const Route = createFileRoute("/_workspace/availability/$id")({
  component: AvailabilitySlotDetailPage,
})

const statusVariant: Record<
  SlotDetail["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  open: "default",
  closed: "secondary",
  sold_out: "destructive",
  cancelled: "outline",
}

function formatDateTime(value: string | null) {
  return value ? value.replace("T", " ").slice(0, 16) : "-"
}

function AvailabilitySlotDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: slotData, isPending } = useQuery({
    queryKey: ["availability-slot", id],
    queryFn: () => api.get<{ data: SlotDetail }>(`/v1/availability/slots/${id}`),
  })

  const slot = slotData?.data

  const productQuery = useQuery({
    queryKey: ["availability-slot-product", slot?.productId],
    enabled: Boolean(slot?.productId),
    queryFn: () => api.get<{ data: Product }>(`/v1/products/${slot?.productId}`),
  })

  const slotPickupsQuery = useQuery({
    queryKey: ["availability-slot-pickups", id],
    queryFn: () =>
      api.get<ListResponse<SlotPickup>>(`/v1/availability/slot-pickups?slotId=${id}&limit=200`),
  })

  const pickupPointsQuery = useQuery({
    queryKey: ["availability-pickup-points", slot?.productId],
    enabled: Boolean(slot?.productId),
    queryFn: () =>
      api.get<ListResponse<PickupPoint>>(
        `/v1/availability/pickup-points?productId=${slot?.productId}&limit=200`,
      ),
  })

  const closeoutsQuery = useQuery({
    queryKey: ["availability-slot-closeouts", id],
    queryFn: () =>
      api.get<ListResponse<Closeout>>(`/v1/availability/closeouts?slotId=${id}&limit=200`),
  })

  const assignmentsQuery = useQuery({
    queryKey: ["availability-slot-assignments", id],
    queryFn: () =>
      api.get<ListResponse<Assignment>>(`/v1/resources/slot-assignments?slotId=${id}&limit=200`),
  })

  const resourcesQuery = useQuery({
    queryKey: ["availability-slot-resources"],
    queryFn: () => api.get<ListResponse<Resource>>("/v1/resources/resources?limit=200"),
  })

  const bookingsQuery = useQuery({
    queryKey: ["availability-slot-bookings"],
    queryFn: () => api.get<ListResponse<Booking>>("/v1/bookings?limit=200"),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/availability/slots/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["availability", "slots"] })
      void navigate({ to: "/availability" })
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!slot) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Slot not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/availability" })}>
          Back to Availability
        </Button>
      </div>
    )
  }

  const pickupPointById = new Map(
    (pickupPointsQuery.data?.data ?? []).map((item) => [item.id, item]),
  )
  const resourceById = new Map((resourcesQuery.data?.data ?? []).map((item) => [item.id, item]))
  const bookingById = new Map((bookingsQuery.data?.data ?? []).map((item) => [item.id, item]))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/availability" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {slot.dateLocal} · {formatDateTime(slot.startsAt)}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={statusVariant[slot.status]} className="capitalize">
              {slot.status.replace("_", " ")}
            </Badge>
            <Badge variant="outline">{slot.timezone}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {slot.productId ? (
            <Button
              variant="outline"
              onClick={() => void navigate({ to: "/products/$id", params: { id: slot.productId } })}
            >
              <Package className="mr-2 h-4 w-4" />
              Open Product
            </Button>
          ) : null}
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Delete this slot?")) {
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
            <CardTitle>Slot Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Product:</span>{" "}
              <span>{productQuery.data?.data.name ?? slot.productId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Rule:</span>{" "}
              <span>{slot.availabilityRuleId ?? "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Start Time ID:</span>{" "}
              {slot.startTimeId ? (
                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={() =>
                    void navigate({
                      to: "/availability/start-times/$id",
                      params: { id: slot.startTimeId! },
                    })
                  }
                >
                  {slot.startTimeId}
                </Button>
              ) : (
                <span>-</span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Ends At:</span>{" "}
              <span>{formatDateTime(slot.endsAt)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Unlimited:</span>{" "}
              <span>{slot.unlimited ? "Yes" : "No"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Past Cutoff:</span>{" "}
              <span>{slot.pastCutoff ? "Yes" : "No"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Too Early:</span>{" "}
              <span>{slot.tooEarly ? "Yes" : "No"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity State</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Initial Pax:</span>{" "}
              <span>{slot.initialPax ?? "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining Pax:</span>{" "}
              <span>{slot.remainingPax ?? "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Initial Pickups:</span>{" "}
              <span>{slot.initialPickups ?? "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining Pickups:</span>{" "}
              <span>{slot.remainingPickups ?? "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining Resources:</span>{" "}
              <span>{slot.remainingResources ?? "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              <span>{new Date(slot.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>{" "}
              <span>{new Date(slot.updatedAt).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {slot.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{slot.notes}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Truck className="h-4 w-4" />
          <CardTitle>Pickup Capacity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(slotPickupsQuery.data?.data.length ?? 0) === 0 ? (
            <p className="text-muted-foreground">No pickup capacity records for this slot.</p>
          ) : (
            slotPickupsQuery.data?.data.map((pickup) => {
              const point = pickupPointById.get(pickup.pickupPointId)
              return (
                <div key={pickup.id} className="rounded-md border p-3">
                  <div className="font-medium">{point?.name ?? pickup.pickupPointId}</div>
                  <div className="text-muted-foreground">
                    {point?.locationText ?? "No location text"}
                  </div>
                  <div className="mt-2">
                    Initial: {pickup.initialCapacity ?? "-"} · Remaining:{" "}
                    {pickup.remainingCapacity ?? "-"}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Wrench className="h-4 w-4" />
          <CardTitle>Resource Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(assignmentsQuery.data?.data.length ?? 0) === 0 ? (
            <p className="text-muted-foreground">No resource assignments linked to this slot.</p>
          ) : (
            assignmentsQuery.data?.data.map((assignment) => (
              <div key={assignment.id} className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {assignment.status}
                  </Badge>
                  <span>
                    {resourceById.get(assignment.resourceId ?? "")?.name ??
                      assignment.resourceId ??
                      "Unassigned resource"}
                  </span>
                </div>
                <div className="mt-2 text-muted-foreground">
                  Booking:{" "}
                  {bookingById.get(assignment.bookingId ?? "")?.bookingNumber ??
                    assignment.bookingId ??
                    "-"}
                </div>
                <div className="text-muted-foreground">
                  Pool: {assignment.poolId ?? "-"} · Released:{" "}
                  {formatDateTime(assignment.releasedAt)}
                </div>
                {assignment.notes ? (
                  <div className="mt-2 whitespace-pre-wrap">{assignment.notes}</div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <CardTitle>Related Closeouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(closeoutsQuery.data?.data.length ?? 0) === 0 ? (
            <p className="text-muted-foreground">No closeouts attached directly to this slot.</p>
          ) : (
            closeoutsQuery.data?.data.map((closeout) => (
              <div key={closeout.id} className="rounded-md border p-3">
                <div className="font-medium">{closeout.dateLocal}</div>
                <div className="text-muted-foreground">Created by: {closeout.createdBy ?? "-"}</div>
                {closeout.reason ? (
                  <div className="mt-2 whitespace-pre-wrap">{closeout.reason}</div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
