import type { ProductLite } from "@voyantjs/booking-requirements-react"
import { ClipboardList } from "lucide-react"
import type { ComponentProps } from "react"
import { Label } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingRequirementsContactTab } from "./booking-requirements-contact-tab"
import { BookingRequirementsQuestionsTab } from "./booking-requirements-questions-tab"

export function BookingRequirementsPage({
  products,
  productId,
  onProductChange,
  contactTab,
  questionsTab,
}: {
  products: ProductLite[]
  productId: string
  onProductChange: (value: string) => void
  contactTab: ComponentProps<typeof BookingRequirementsContactTab>
  questionsTab: ComponentProps<typeof BookingRequirementsQuestionsTab>
}) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Booking Requirements</h1>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <Label>Product</Label>
        <Select value={productId} onValueChange={onProductChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a product…" />
          </SelectTrigger>
          <SelectContent>
            {products.length === 0 ? (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">No products</div>
            ) : null}
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
                {product.code ? ` · ${product.code}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Pick a product to configure traveler data collection.
        </p>
      </div>

      {!productId ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a product above to manage its contact requirements and custom booking questions.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="contact-requirements" className="flex flex-col gap-4">
          <TabsList>
            <TabsTrigger value="contact-requirements">Contact Requirements</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>
          <TabsContent value="contact-requirements">
            <BookingRequirementsContactTab {...contactTab} />
          </TabsContent>
          <TabsContent value="questions">
            <BookingRequirementsQuestionsTab {...questionsTab} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
