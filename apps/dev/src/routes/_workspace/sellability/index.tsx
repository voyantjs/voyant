import { createFileRoute } from "@tanstack/react-router"
import { SellabilityPage } from "@/components/voyant/sellability/sellability-page"

export const Route = createFileRoute("/_workspace/sellability/")({
  component: SellabilityPage,
})
