import { createFileRoute } from "@tanstack/react-router"
import { AvailabilityPage } from "./page"
import {
  getAvailabilityCloseoutsQueryOptions,
  getAvailabilityPickupPointsQueryOptions,
  getAvailabilityProductsQueryOptions,
  getAvailabilityRulesQueryOptions,
  getAvailabilitySlotsQueryOptions,
  getAvailabilityStartTimesQueryOptions,
} from "./shared"

export const Route = createFileRoute("/_workspace/availability/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getAvailabilityProductsQueryOptions()),
      context.queryClient.ensureQueryData(getAvailabilityRulesQueryOptions()),
      context.queryClient.ensureQueryData(getAvailabilityStartTimesQueryOptions()),
      context.queryClient.ensureQueryData(getAvailabilitySlotsQueryOptions()),
      context.queryClient.ensureQueryData(getAvailabilityCloseoutsQueryOptions()),
      context.queryClient.ensureQueryData(getAvailabilityPickupPointsQueryOptions()),
    ]),
  component: AvailabilityPage,
})
