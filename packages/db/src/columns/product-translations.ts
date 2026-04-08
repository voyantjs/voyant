import { jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product translations columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productTranslationsTable = pgTable("product_translations", {
 *   id: typeId("product_translations"),
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   ...productTranslationsCoreColumns(),
 * })
 */
export function productTranslationsCoreColumns() {
  return {
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    slug: text("slug"),
    description: text("description"),
    inclusionsHtml: text("inclusions_html"),
    exclusionsHtml: text("exclusions_html"),
    termsHtml: text("terms_html"),
    attributes: jsonb("attributes").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}
