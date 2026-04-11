import { createFileRoute } from "@tanstack/react-router"
import { getSuppliersQueryOptions } from "@/components/voyant/suppliers/shared"
import { SuppliersPage } from "@/components/voyant/suppliers/suppliers-page"

export const Route = createFileRoute("/_workspace/suppliers/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getSuppliersQueryOptions()),
  component: SuppliersPage,
})
