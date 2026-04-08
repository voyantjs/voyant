import { ContactPointsTab as IdentityContactPointsTab } from "../../identity/_components/contact-points-tab"

type Props = { facilityId: string }

export function ContactPointsTab({ facilityId }: Props) {
  return <IdentityContactPointsTab entityType="facility" entityId={facilityId} />
}
