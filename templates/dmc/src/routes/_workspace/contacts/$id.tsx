import { createFileRoute } from "@tanstack/react-router"
import { ContactDetailPage } from "@/components/voyant/contacts/contact-detail-page"
import {
  getContactAddressesQueryOptions,
  getContactNotesQueryOptions,
  getContactQueryOptions,
} from "@/components/voyant/contacts/contact-shared"

export const Route = createFileRoute("/_workspace/contacts/$id")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(getContactQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getContactNotesQueryOptions(params.id)),
      context.queryClient.ensureQueryData(getContactAddressesQueryOptions(params.id)),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <ContactDetailPage id={id} />
}
