import { createFileRoute } from "@tanstack/react-router"
import { GroundPage } from "@/components/voyant/ground/ground-page"
import {
  getGroundDriversQueryOptions,
  getGroundOperatorsQueryOptions,
  getGroundVehiclesQueryOptions,
} from "@/components/voyant/ground/ground-shared"

export const Route = createFileRoute("/_workspace/ground/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getGroundOperatorsQueryOptions({ limit: 25, offset: 0 })),
      context.queryClient.ensureQueryData(getGroundVehiclesQueryOptions({ limit: 25, offset: 0 })),
      context.queryClient.ensureQueryData(getGroundDriversQueryOptions({ limit: 25, offset: 0 })),
    ]),
  component: GroundPage,
})
