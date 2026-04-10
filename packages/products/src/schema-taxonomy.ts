import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { products } from "./schema-core"

export const productTypes = pgTable(
  "product_types",
  {
    id: typeId("product_types"),
    name: text("name").notNull(),
    code: text("code").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uidx_product_types_code").on(table.code),
    index("idx_product_types_active").on(table.active),
  ],
)

export type ProductType = typeof productTypes.$inferSelect
export type NewProductType = typeof productTypes.$inferInsert

export const productCategories = pgTable(
  "product_categories",
  {
    id: typeId("product_categories"),
    parentId: text("parent_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uidx_product_categories_slug").on(table.slug),
    index("idx_product_categories_parent").on(table.parentId),
    index("idx_product_categories_active").on(table.active),
  ],
)

export type ProductCategory = typeof productCategories.$inferSelect
export type NewProductCategory = typeof productCategories.$inferInsert

export const productTags = pgTable(
  "product_tags",
  {
    id: typeId("product_tags"),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uidx_product_tags_name").on(table.name)],
)

export type ProductTag = typeof productTags.$inferSelect
export type NewProductTag = typeof productTags.$inferInsert

export const productCategoryProducts = pgTable(
  "product_category_products",
  {
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: typeIdRef("category_id")
      .notNull()
      .references(() => productCategories.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index("idx_pcp_category").on(table.categoryId),
  ],
)

export const productTagProducts = pgTable(
  "product_tag_products",
  {
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tagId: typeIdRef("tag_id")
      .notNull()
      .references(() => productTags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.tagId] }),
    index("idx_ptp_tag").on(table.tagId),
  ],
)
