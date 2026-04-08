import { NamedContactsTab as IdentityNamedContactsTab } from "../../identity/_components/named-contacts-tab"

type Props = { facilityId: string }

export function NamedContactsTab({ facilityId }: Props) {
  return <IdentityNamedContactsTab entityType="facility" entityId={facilityId} />
}
