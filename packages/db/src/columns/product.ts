import { jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product columns shared between db-main.catalog.products
 * and db-marketplace.marketplace.publication_products.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productsTable = pgTable("products", {
 *   id: typeId("products"),
 *   ...productCoreColumns(),
 *   // Add table-specific columns...
 * })
 */
export function productCoreColumns() {
  return {
    title: text("title").notNull(),
    description: text("description"),
    language: text("language"),
    currency: text("currency").default("USD"),
    location: jsonb("location"),
    tags: text("tags").array(),
    attributes: jsonb("attributes").notNull().default("{}"),
    titleSearch: text("title_search"),
  }
}

/**
 * Timestamp columns with configurable nullability.
 *
 * @param required - If true, columns are NOT NULL (used by db-marketplace).
 *                   If false/undefined, columns are nullable (used by db-main).
 */
export function timestampColumns(required?: boolean) {
  if (required) {
    return {
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    }
  }

  return {
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}
