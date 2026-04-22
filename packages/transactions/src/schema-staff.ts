import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { offerItems, offers } from "./schema-offers.js"
import { orderItems, orders } from "./schema-orders.js"
import { transactionStaffAssignmentRoleEnum } from "./schema-shared.js"

export const offerStaffAssignments = pgTable(
  "offer_staff_assignments",
  {
    id: typeId("offer_staff_assignments"),
    offerId: typeIdRef("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    offerItemId: typeIdRef("offer_item_id").references(() => offerItems.id, {
      onDelete: "set null",
    }),
    personId: text("person_id"),
    role: transactionStaffAssignmentRoleEnum("role").notNull().default("service_assignee"),
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
    index("idx_offer_staff_assignments_offer_created").on(table.offerId, table.createdAt),
    index("idx_offer_staff_assignments_item_created").on(table.offerItemId, table.createdAt),
    index("idx_offer_staff_assignments_role_created").on(
      table.offerId,
      table.role,
      table.createdAt,
    ),
    index("idx_offer_staff_assignments_person_created").on(table.personId, table.createdAt),
  ],
)

export const orderStaffAssignments = pgTable(
  "order_staff_assignments",
  {
    id: typeId("order_staff_assignments"),
    orderId: typeIdRef("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: typeIdRef("order_item_id").references(() => orderItems.id, {
      onDelete: "set null",
    }),
    personId: text("person_id"),
    role: transactionStaffAssignmentRoleEnum("role").notNull().default("service_assignee"),
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
    index("idx_order_staff_assignments_order_created").on(table.orderId, table.createdAt),
    index("idx_order_staff_assignments_item_created").on(table.orderItemId, table.createdAt),
    index("idx_order_staff_assignments_role_created").on(
      table.orderId,
      table.role,
      table.createdAt,
    ),
    index("idx_order_staff_assignments_person_created").on(table.personId, table.createdAt),
  ],
)

export type OfferStaffAssignment = typeof offerStaffAssignments.$inferSelect
export type NewOfferStaffAssignment = typeof offerStaffAssignments.$inferInsert
export type OrderStaffAssignment = typeof orderStaffAssignments.$inferSelect
export type NewOrderStaffAssignment = typeof orderStaffAssignments.$inferInsert
