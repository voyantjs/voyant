import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { offerItems, offers } from "./schema-offers.js"
import { orderItems, orders } from "./schema-orders.js"
import { transactionContactAssignmentRoleEnum } from "./schema-shared.js"

export const offerContactAssignments = pgTable(
  "offer_contact_assignments",
  {
    id: typeId("offer_contact_assignments"),
    offerId: typeIdRef("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    offerItemId: typeIdRef("offer_item_id").references(() => offerItems.id, {
      onDelete: "set null",
    }),
    personId: text("person_id"),
    role: transactionContactAssignmentRoleEnum("role").notNull().default("primary_contact"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    preferredLanguage: text("preferred_language"),
    isPrimary: boolean("is_primary").notNull().default(false),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_offer_contact_assignments_offer_created").on(table.offerId, table.createdAt),
    index("idx_offer_contact_assignments_item_created").on(table.offerItemId, table.createdAt),
    index("idx_offer_contact_assignments_role_created").on(
      table.offerId,
      table.role,
      table.createdAt,
    ),
    index("idx_offer_contact_assignments_person_created").on(table.personId, table.createdAt),
  ],
)

export const orderContactAssignments = pgTable(
  "order_contact_assignments",
  {
    id: typeId("order_contact_assignments"),
    orderId: typeIdRef("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: typeIdRef("order_item_id").references(() => orderItems.id, {
      onDelete: "set null",
    }),
    personId: text("person_id"),
    role: transactionContactAssignmentRoleEnum("role").notNull().default("primary_contact"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    preferredLanguage: text("preferred_language"),
    isPrimary: boolean("is_primary").notNull().default(false),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_order_contact_assignments_order_created").on(table.orderId, table.createdAt),
    index("idx_order_contact_assignments_item_created").on(table.orderItemId, table.createdAt),
    index("idx_order_contact_assignments_role_created").on(
      table.orderId,
      table.role,
      table.createdAt,
    ),
    index("idx_order_contact_assignments_person_created").on(table.personId, table.createdAt),
  ],
)

export type OfferContactAssignment = typeof offerContactAssignments.$inferSelect
export type NewOfferContactAssignment = typeof offerContactAssignments.$inferInsert
export type OrderContactAssignment = typeof orderContactAssignments.$inferSelect
export type NewOrderContactAssignment = typeof orderContactAssignments.$inferInsert
