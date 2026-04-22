export const queryKeys = {
  contacts: {
    all: ["contacts"] as const,
    list: (search?: string) => [...queryKeys.contacts.all, "list", { search }] as const,
    detail: (id: string) => [...queryKeys.contacts.all, "detail", id] as const,
    notes: (id: string) => [...queryKeys.contacts.all, id, "notes"] as const,
    communications: (id: string) => [...queryKeys.contacts.all, id, "communications"] as const,
  },
  suppliers: {
    all: ["suppliers"] as const,
    list: (search?: string) => [...queryKeys.suppliers.all, "list", { search }] as const,
    detail: (id: string) => [...queryKeys.suppliers.all, "detail", id] as const,
    services: (id: string) => [...queryKeys.suppliers.all, id, "services"] as const,
    rates: (id: string) => [...queryKeys.suppliers.all, id, "rates"] as const,
    notes: (id: string) => [...queryKeys.suppliers.all, id, "notes"] as const,
    availability: (id: string) => [...queryKeys.suppliers.all, id, "availability"] as const,
    contracts: (id: string) => [...queryKeys.suppliers.all, id, "contracts"] as const,
  },
  products: {
    all: ["products"] as const,
    list: (search?: string) => [...queryKeys.products.all, "list", { search }] as const,
    detail: (id: string) => [...queryKeys.products.all, "detail", id] as const,
    days: (id: string) => [...queryKeys.products.all, id, "days"] as const,
    versions: (id: string) => [...queryKeys.products.all, id, "versions"] as const,
    notes: (id: string) => [...queryKeys.products.all, id, "notes"] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    list: (search?: string) => [...queryKeys.bookings.all, "list", { search }] as const,
    detail: (id: string) => [...queryKeys.bookings.all, "detail", id] as const,
    travelers: (id: string) => [...queryKeys.bookings.all, id, "travelers"] as const,
    supplierStatuses: (id: string) => [...queryKeys.bookings.all, id, "supplierStatuses"] as const,
    activityLog: (id: string) => [...queryKeys.bookings.all, id, "activityLog"] as const,
    notes: (id: string) => [...queryKeys.bookings.all, id, "notes"] as const,
    documents: (id: string) => [...queryKeys.bookings.all, id, "documents"] as const,
  },
  // Legacy keys — used by accept-invite flow
  inviteTokens: {
    all: ["inviteTokens"] as const,
    list: (operatorId: string) => ["inviteTokens", operatorId, "list"] as const,
  },
  grants: {
    all: ["grants"] as const,
    list: (operatorId: string) => ["grants", operatorId, "list"] as const,
  },
  legal: {
    all: ["legal"] as const,
    contracts: {
      all: ["legal", "contracts"] as const,
      list: (search?: string) => ["legal", "contracts", "list", { search }] as const,
      detail: (id: string) => ["legal", "contracts", "detail", id] as const,
      signatures: (id: string) => ["legal", "contracts", id, "signatures"] as const,
      attachments: (id: string) => ["legal", "contracts", id, "attachments"] as const,
    },
    policies: {
      all: ["legal", "policies"] as const,
      list: (search?: string) => ["legal", "policies", "list", { search }] as const,
      detail: (id: string) => ["legal", "policies", "detail", id] as const,
      versions: (id: string) => ["legal", "policies", id, "versions"] as const,
      rules: (versionId: string) => ["legal", "policies", "rules", versionId] as const,
      assignments: () => ["legal", "policies", "assignments"] as const,
      acceptances: () => ["legal", "policies", "acceptances"] as const,
    },
    templates: {
      all: ["legal", "templates"] as const,
      list: (search?: string) => ["legal", "templates", "list", { search }] as const,
      detail: (id: string) => ["legal", "templates", "detail", id] as const,
      versions: (id: string) => ["legal", "templates", id, "versions"] as const,
    },
    numberSeries: {
      all: ["legal", "numberSeries"] as const,
      list: () => ["legal", "numberSeries", "list"] as const,
      detail: (id: string) => ["legal", "numberSeries", "detail", id] as const,
    },
  },
  finance: {
    all: ["finance"] as const,
    invoices: {
      all: ["finance", "invoices"] as const,
      list: (search?: string) => ["finance", "invoices", "list", { search }] as const,
      detail: (id: string) => ["finance", "invoices", "detail", id] as const,
    },
    payments: (invoiceId: string) => ["finance", "payments", invoiceId] as const,
    creditNotes: {
      all: ["finance", "creditNotes"] as const,
      list: () => ["finance", "creditNotes", "list"] as const,
    },
    supplierPayments: {
      all: ["finance", "supplierPayments"] as const,
      list: () => ["finance", "supplierPayments", "list"] as const,
    },
    notes: (entityType: string, entityId: string) =>
      ["finance", "notes", entityType, entityId] as const,
    reports: {
      revenue: (from?: string, to?: string) =>
        ["finance", "reports", "revenue", { from, to }] as const,
      aging: () => ["finance", "reports", "aging"] as const,
      profitability: (from?: string, to?: string) =>
        ["finance", "reports", "profitability", { from, to }] as const,
    },
  },
}
