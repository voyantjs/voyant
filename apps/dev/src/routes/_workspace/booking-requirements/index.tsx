import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ClipboardList } from "lucide-react"
import { useState } from "react"
import { Label } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContactRequirementsTab } from "./contact-tab"
import { QuestionsTab } from "./questions-tab"
import { getBookingRequirementProductsQueryOptions } from "./shared"

export const Route = createFileRoute("/_workspace/booking-requirements/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getBookingRequirementProductsQueryOptions()),
  component: BookingRequirementsPage,
})

function BookingRequirementsPage() {
  const [productId, setProductId] = useState<string>("")

  const productsQuery = useQuery(getBookingRequirementProductsQueryOptions())
  const products = productsQuery.data?.data ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Booking Requirements</h1>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <Label>Product</Label>
        <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a product…" />
          </SelectTrigger>
          <SelectContent>
            {products.length === 0 && (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                {productsQuery.isPending ? "Loading…" : "No products"}
              </div>
            )}
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
                {p.code ? ` · ${p.code}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Pick a product to configure traveler data collection.
        </p>
      </div>

      {!productId && (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a product above to manage its contact requirements and custom booking questions.
          </p>
        </div>
      )}

      {productId && (
        <Tabs defaultValue="contact-requirements" className="flex flex-col gap-4">
          <TabsList>
            <TabsTrigger value="contact-requirements">Contact Requirements</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>
          <TabsContent value="contact-requirements">
            <ContactRequirementsTab productId={productId} />
          </TabsContent>
          <TabsContent value="questions">
            <QuestionsTab productId={productId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
