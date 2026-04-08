import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Loader2, Package, Trash2, Wrench } from "lucide-react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { api } from "@/lib/api-client"

type AllocationDetail = {
  id: string
  poolId: string
  productId: string
  availabilityRuleId: string | null
  startTimeId: string | null
  quantityRequired: number
  allocationMode: "shared" | "exclusive"
  priority: number
  createdAt: string
  updatedAt: string
}

type Pool = { id: string; name: string }
type Product = { id: string; name: string }
type Rule = { id: string; recurrenceRule: string }
type StartTime = { id: string; label: string | null; startTimeLocal: string }

export const Route = createFileRoute("/_workspace/resources/allocations/$id")({
  component: ResourceAllocationDetailPage,
})

function ResourceAllocationDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: allocationData, isPending } = useQuery({
    queryKey: ["resource-allocation", id],
    queryFn: () => api.get<{ data: AllocationDetail }>(`/v1/resources/allocations/${id}`),
  })

  const allocation = allocationData?.data

  const poolQuery = useQuery({
    queryKey: ["resource-allocation-pool", allocation?.poolId],
    enabled: Boolean(allocation?.poolId),
    queryFn: () => api.get<{ data: Pool }>(`/v1/resources/pools/${allocation?.poolId}`),
  })

  const productQuery = useQuery({
    queryKey: ["resource-allocation-product", allocation?.productId],
    enabled: Boolean(allocation?.productId),
    queryFn: () => api.get<{ data: Product }>(`/v1/products/${allocation?.productId}`),
  })

  const ruleQuery = useQuery({
    queryKey: ["resource-allocation-rule", allocation?.availabilityRuleId],
    enabled: Boolean(allocation?.availabilityRuleId),
    queryFn: () =>
      api.get<{ data: Rule }>(`/v1/availability/rules/${allocation?.availabilityRuleId}`),
  })

  const startTimeQuery = useQuery({
    queryKey: ["resource-allocation-start-time", allocation?.startTimeId],
    enabled: Boolean(allocation?.startTimeId),
    queryFn: () =>
      api.get<{ data: StartTime }>(`/v1/availability/start-times/${allocation?.startTimeId}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/v1/resources/allocations/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resources", "allocations"] })
      void navigate({ to: "/resources" })
    },
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!allocation) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Allocation not found</p>
        <Button variant="outline" onClick={() => void navigate({ to: "/resources" })}>
          Back to Resources
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => void navigate({ to: "/resources" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Resource Allocation</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {allocation.allocationMode}
            </Badge>
            <Badge variant="secondary">Qty {allocation.quantityRequired}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              void navigate({ to: "/resources/pools/$id", params: { id: allocation.poolId } })
            }
          >
            <Wrench className="mr-2 h-4 w-4" />
            Open Pool
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              void navigate({ to: "/products/$id", params: { id: allocation.productId } })
            }
          >
            <Package className="mr-2 h-4 w-4" />
            Open Product
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Delete this allocation?")) {
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

      <Card>
        <CardHeader>
          <CardTitle>Allocation Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Pool:</span>{" "}
            <span>{poolQuery.data?.data.name ?? allocation.poolId}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Product:</span>{" "}
            <span>{productQuery.data?.data.name ?? allocation.productId}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Rule:</span>{" "}
            <span>
              {ruleQuery.data?.data.recurrenceRule ?? allocation.availabilityRuleId ?? "-"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Start Time:</span>{" "}
            <span>
              {startTimeQuery.data?.data.label ??
                startTimeQuery.data?.data.startTimeLocal ??
                allocation.startTimeId ??
                "-"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Priority:</span>{" "}
            <span>{allocation.priority}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            <span>{new Date(allocation.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Updated:</span>{" "}
            <span>{new Date(allocation.updatedAt).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
