import { boolean, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product publish settings columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productPublishSettingsTable = pgTable("product_publish_settings", {
 *   productId: typeIdRef("product_id").primaryKey().references(...),
 *   ...productPublishSettingsCoreColumns(),
 * })
 */
export function productPublishSettingsCoreColumns() {
  return {
    website: boolean("website").notNull().default(false),
    marketplace: boolean("marketplace").notNull().default(false),
    websitePublishedAt: timestamp("website_published_at", { withTimezone: true }),
    marketplacePublishedAt: timestamp("marketplace_published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
}
