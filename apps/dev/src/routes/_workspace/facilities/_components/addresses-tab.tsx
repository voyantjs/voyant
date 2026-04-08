import { AddressesTab as IdentityAddressesTab } from "../../identity/_components/addresses-tab"

type Props = { facilityId: string }

export function AddressesTab({ facilityId }: Props) {
  return <IdentityAddressesTab entityType="facility" entityId={facilityId} />
}
