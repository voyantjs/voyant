import { createFileRoute } from "@tanstack/react-router"
import { ResourcesPage } from "@/components/voyant/resources/resources-page"
import { ResourcesPageSkeleton } from "@/components/voyant/resources/resources-page-skeleton"
import {
  getResourceAllocationsQueryOptions,
  getResourceAssignmentsQueryOptions,
  getResourceBookingsQueryOptions,
  getResourceCloseoutsQueryOptions,
  getResourcePoolsQueryOptions,
  getResourceProductsQueryOptions,
  getResourceResourcesQueryOptions,
  getResourceRulesQueryOptions,
  getResourceSlotsQueryOptions,
  getResourceStartTimesQueryOptions,
  getResourceSuppliersQueryOptions,
} from "@/components/voyant/resources/resources-shared"

export const Route = createFileRoute("/_workspace/resources/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getResourceSuppliersQueryOptions()),
      context.queryClient.ensureQueryData(getResourceProductsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceBookingsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceSlotsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceRulesQueryOptions()),
      context.queryClient.ensureQueryData(getResourceStartTimesQueryOptions()),
      context.queryClient.ensureQueryData(getResourceResourcesQueryOptions()),
      context.queryClient.ensureQueryData(getResourcePoolsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceAllocationsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceAssignmentsQueryOptions()),
      context.queryClient.ensureQueryData(getResourceCloseoutsQueryOptions()),
    ]),
  pendingComponent: ResourcesPageSkeleton,
  component: ResourcesPage,
})
