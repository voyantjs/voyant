import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { facilities } from "@voyantjs/facilities/schema"
import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const supplierTypeEnum = pgEnum("supplier_type", [
  "hotel",
  "transfer",
  "guide",
  "experience",
  "airline",
  "restaurant",
  "other",
])

export const supplierStatusEnum = pgEnum("supplier_status", ["active", "inactive", "pending"])

export const serviceTypeEnum = pgEnum("service_type", [
  "accommodation",
  "transfer",
  "experience",
  "guide",
  "meal",
  "other",
])

export const rateUnitEnum = pgEnum("rate_unit", [
  "per_person",
  "per_group",
  "per_night",
  "per_vehicle",
  "flat",
])

export const supplierContractStatusEnum = pgEnum("supplier_contract_status", [
  "active",
  "expired",
  "pending",
  "terminated",
])

// ---------- suppliers ----------

export const suppliers = pgTable(
  "suppliers",
  {
    id: typeId("suppliers"),

    name: text("name").notNull(),
    type: supplierTypeEnum("type").notNull(),
    status: supplierStatusEnum("status").notNull().default("active"),
    description: text("description"),

    // Defaults
    defaultCurrency: text("default_currency"),
    paymentTermsDays: integer("payment_terms_days"),
    primaryFacilityId: typeIdRef("primary_facility_id").references(() => facilities.id, {
      onDelete: "set null",
    }),

    // Metadata
    tags: jsonb("tags").$type<string[]>().default([]),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_suppliers_type").on(table.type),
    index("idx_suppliers_status").on(table.status),
    index("idx_suppliers_primary_facility").on(table.primaryFacilityId),
  ],
)

export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert

// ---------- supplier_services ----------

export const supplierServices = pgTable(
  "supplier_services",
  {
    id: typeId("supplier_services"),
    supplierId: typeIdRef("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),

    serviceType: serviceTypeEnum("service_type").notNull(),
    facilityId: typeIdRef("facility_id").references(() => facilities.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    duration: text("duration"),
    capacity: integer("capacity"),
    active: boolean("active").notNull().default(true),

    // Metadata
    tags: jsonb("tags").$type<string[]>().default([]),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_supplier_services_supplier").on(table.supplierId),
    index("idx_supplier_services_type").on(table.serviceType),
    index("idx_supplier_services_facility").on(table.facilityId),
  ],
)

export type SupplierService = typeof supplierServices.$inferSelect
export type NewSupplierService = typeof supplierServices.$inferInsert

// ---------- supplier_rates ----------

export const supplierRates = pgTable(
  "supplier_rates",
  {
    id: typeId("supplier_rates"),
    serviceId: typeIdRef("service_id")
      .notNull()
      .references(() => supplierServices.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    currency: text("currency").notNull(),
    amountCents: integer("amount_cents").notNull(),
    unit: rateUnitEnum("unit").notNull(),

    // Season range
    validFrom: date("valid_from"),
    validTo: date("valid_to"),

    // Group size
    minPax: integer("min_pax"),
    maxPax: integer("max_pax"),

    notes: text("notes"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_supplier_rates_service").on(table.serviceId),
    index("idx_supplier_rates_validity").on(table.validFrom, table.validTo),
  ],
)

export type SupplierRate = typeof supplierRates.$inferSelect
export type NewSupplierRate = typeof supplierRates.$inferInsert

// ---------- supplier_notes ----------

export const supplierNotes = pgTable(
  "supplier_notes",
  {
    id: typeId("supplier_notes"),
    supplierId: typeIdRef("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_supplier_notes_supplier").on(table.supplierId)],
)

export type SupplierNote = typeof supplierNotes.$inferSelect
export type NewSupplierNote = typeof supplierNotes.$inferInsert

// ---------- supplier_availability ----------

export const supplierAvailability = pgTable(
  "supplier_availability",
  {
    id: typeId("supplier_availability"),
    supplierId: typeIdRef("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    available: boolean("available").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_supplier_availability_supplier").on(table.supplierId),
    index("idx_supplier_availability_date").on(table.date),
  ],
)

export type SupplierAvailabilityEntry = typeof supplierAvailability.$inferSelect
export type NewSupplierAvailabilityEntry = typeof supplierAvailability.$inferInsert

// ---------- supplier_contracts ----------

export const supplierContracts = pgTable(
  "supplier_contracts",
  {
    id: typeId("supplier_contracts"),
    supplierId: typeIdRef("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    agreementNumber: text("agreement_number"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    renewalDate: date("renewal_date"),
    terms: text("terms"),
    status: supplierContractStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_supplier_contracts_supplier").on(table.supplierId),
    index("idx_supplier_contracts_status").on(table.status),
  ],
)

export type SupplierContract = typeof supplierContracts.$inferSelect
export type NewSupplierContract = typeof supplierContracts.$inferInsert

// ---------- relations ----------

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  primaryFacility: one(facilities, {
    fields: [suppliers.primaryFacilityId],
    references: [facilities.id],
  }),
  services: many(supplierServices),
  notes: many(supplierNotes),
  availability: many(supplierAvailability),
  contracts: many(supplierContracts),
}))

export const supplierServicesRelations = relations(supplierServices, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [supplierServices.supplierId], references: [suppliers.id] }),
  facility: one(facilities, {
    fields: [supplierServices.facilityId],
    references: [facilities.id],
  }),
  rates: many(supplierRates),
}))

export const supplierRatesRelations = relations(supplierRates, ({ one }) => ({
  service: one(supplierServices, {
    fields: [supplierRates.serviceId],
    references: [supplierServices.id],
  }),
}))

export const supplierNotesRelations = relations(supplierNotes, ({ one }) => ({
  supplier: one(suppliers, { fields: [supplierNotes.supplierId], references: [suppliers.id] }),
}))

export const supplierAvailabilityRelations = relations(supplierAvailability, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierAvailability.supplierId],
    references: [suppliers.id],
  }),
}))

export const supplierContractsRelations = relations(supplierContracts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierContracts.supplierId],
    references: [suppliers.id],
  }),
}))
