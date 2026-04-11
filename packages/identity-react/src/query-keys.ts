export interface ContactPointsListFilters {
  entityType?: string | undefined
  entityId?: string | undefined
  kind?: string | undefined
  isPrimary?: boolean | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export interface AddressesListFilters {
  entityType?: string | undefined
  entityId?: string | undefined
  label?: string | undefined
  isPrimary?: boolean | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export interface NamedContactsListFilters {
  entityType?: string | undefined
  entityId?: string | undefined
  role?: string | undefined
  isPrimary?: boolean | undefined
  search?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export const identityQueryKeys = {
  all: ["identity"] as const,
  contactPoints: () => [...identityQueryKeys.all, "contact-points"] as const,
  contactPointsList: (filters: ContactPointsListFilters) =>
    [...identityQueryKeys.contactPoints(), filters] as const,
  contactPoint: (id: string) => [...identityQueryKeys.contactPoints(), id] as const,
  addresses: () => [...identityQueryKeys.all, "addresses"] as const,
  addressesList: (filters: AddressesListFilters) =>
    [...identityQueryKeys.addresses(), filters] as const,
  address: (id: string) => [...identityQueryKeys.addresses(), id] as const,
  namedContacts: () => [...identityQueryKeys.all, "named-contacts"] as const,
  namedContactsList: (filters: NamedContactsListFilters) =>
    [...identityQueryKeys.namedContacts(), filters] as const,
  namedContact: (id: string) => [...identityQueryKeys.namedContacts(), id] as const,
}
