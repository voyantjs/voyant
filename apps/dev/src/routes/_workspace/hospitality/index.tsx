import { createFileRoute } from "@tanstack/react-router"
import { HospitalityPage } from "@/components/voyant/hospitality/hospitality-page"
import {
  getHospitalityFacilitiesQueryOptions,
  getHospitalityPropertiesQueryOptions,
} from "@/components/voyant/hospitality/hospitality-shared"

export const Route = createFileRoute("/_workspace/hospitality/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getHospitalityPropertiesQueryOptions()),
      context.queryClient.ensureQueryData(getHospitalityFacilitiesQueryOptions()),
    ]),
  component: HospitalityPage,
})
