import { createFileRoute } from "@tanstack/react-router"
import { getSuppliersQueryOptions } from "@/components/voyant/suppliers/shared"
import { SuppliersListSkeleton } from "@/components/voyant/suppliers/suppliers-list-skeleton"
import { SuppliersPage } from "@/components/voyant/suppliers/suppliers-page"

export const Route = createFileRoute("/_workspace/suppliers/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(getSuppliersQueryOptions()),
  pendingComponent: SuppliersListSkeleton,
  component: SuppliersPage,
})
