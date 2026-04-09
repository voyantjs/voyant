import { queryOptions } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Receipt } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import type { OfferData } from "./_components/offer-dialog"
import { OffersTab } from "./_components/offers-tab"
import type { OrderData } from "./_components/order-dialog"
import { OrdersTab } from "./_components/orders-tab"

type ListResponse<T> = { data: T[]; total: number; limit: number; offset: number }

function getOffersQueryOptions() {
  return queryOptions({
    queryKey: ["transactions", "offers"] as const,
    queryFn: () => api.get<ListResponse<OfferData>>("/v1/transactions/offers?limit=200"),
  })
}

function getOrdersQueryOptions() {
  return queryOptions({
    queryKey: ["transactions", "orders"] as const,
    queryFn: () => api.get<ListResponse<OrderData>>("/v1/transactions/orders?limit=200"),
  })
}

export const Route = createFileRoute("/_workspace/transactions/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getOffersQueryOptions()),
      context.queryClient.ensureQueryData(getOrdersQueryOptions()),
    ]),
  component: TransactionsPage,
})

function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">
        Commercial documents — offers represent priced proposals, orders represent committed
        purchases. Items and participants are managed in future passes.
      </p>

      <Tabs defaultValue="offers" className="w-full">
        <TabsList>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="offers" className="mt-4">
          <OffersTab />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <OrdersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
