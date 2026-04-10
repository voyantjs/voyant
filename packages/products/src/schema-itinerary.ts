import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { products } from "./schema-core"
import { productMediaTypeEnum, serviceTypeEnum } from "./schema-shared"

export const productDays = pgTable(
  "product_days",
  {
    id: typeId("product_days"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    title: text("title"),
    description: text("description"),
    location: text("location"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_product_days_product").on(table.productId)],
)

export type ProductDay = typeof productDays.$inferSelect
export type NewProductDay = typeof productDays.$inferInsert

export const productDayServices = pgTable(
  "product_day_services",
  {
    id: typeId("product_day_services"),
    dayId: typeIdRef("day_id")
      .notNull()
      .references(() => productDays.id, { onDelete: "cascade" }),
    supplierServiceId: text("supplier_service_id"),
    serviceType: serviceTypeEnum("service_type").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    costCurrency: text("cost_currency").notNull(),
    costAmountCents: integer("cost_amount_cents").notNull(),
    quantity: integer("quantity").notNull().default(1),
    sortOrder: integer("sort_order"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_day_services_day").on(table.dayId),
    index("idx_product_day_services_supplier_service").on(table.supplierServiceId),
  ],
)

export type ProductDayService = typeof productDayServices.$inferSelect
export type NewProductDayService = typeof productDayServices.$inferInsert

export const productVersions = pgTable(
  "product_versions",
  {
    id: typeId("product_versions"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    authorId: text("author_id").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_product_versions_product").on(table.productId)],
)

export type ProductVersion = typeof productVersions.$inferSelect
export type NewProductVersion = typeof productVersions.$inferInsert

export const productNotes = pgTable(
  "product_notes",
  {
    id: typeId("product_notes"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_product_notes_product").on(table.productId)],
)

export type ProductNote = typeof productNotes.$inferSelect
export type NewProductNote = typeof productNotes.$inferInsert

export const productMedia = pgTable(
  "product_media",
  {
    id: typeId("product_media"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    dayId: typeIdRef("day_id").references(() => productDays.id, { onDelete: "cascade" }),
    mediaType: productMediaTypeEnum("media_type").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    storageKey: text("storage_key"),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_media_product").on(table.productId),
    index("idx_product_media_day").on(table.dayId),
    index("idx_product_media_product_day").on(table.productId, table.dayId),
  ],
)

export type ProductMedia = typeof productMedia.$inferSelect
export type NewProductMedia = typeof productMedia.$inferInsert
