import { createFileRoute } from "@tanstack/react-router"
import { ExtrasPage } from "@/components/voyant/extras/extras-page"

export const Route = createFileRoute("/_workspace/extras/")({
  component: ExtrasPage,
})
