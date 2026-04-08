import { text, timestamp } from "drizzle-orm/pg-core"

/**
 * Tag-related columns shared between db-main and db-marketplace
 */

/**
 * Core columns for shared tags table (legacy)
 * @deprecated Use entityTagColumns() for entity-specific tags
 */
export function tagsCoreColumns() {
  return {
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Columns for entity-specific tag tables (Shopify model)
 *
 * Each entity type (people, organizations, products, collections)
 * has its own tags table with these columns plus an entity reference.
 *
 * Usage:
 * ```ts
 * export const personTagsTable = coreSchema.table("person_tags", {
 *   id: typeId("person_tags"),
 *   personId: typeIdRef("person_id").notNull().references(() => peopleTable.id, { onDelete: "cascade" }),
 *   ...entityTagColumns(),
 * })
 * ```
 */
export function entityTagColumns() {
  return {
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
}
