import { createFileRoute } from "@tanstack/react-router"
import { Receipt } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OffersTab } from "./_components/offers-tab"
import { OrdersTab } from "./_components/orders-tab"

export const Route = createFileRoute("/_workspace/transactions/")({
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
