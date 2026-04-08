import { integer, text } from "drizzle-orm/pg-core"

/**
 * Core product media columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productMediaTable = pgTable("product_media", {
 *   id: typeId("product_media"),
 *   productId: typeIdRef("product_id").notNull().references(...),
 *   ...productMediaCoreColumns(),
 * })
 */
export function productMediaCoreColumns() {
  return {
    url: text("url").notNull(),
    kind: text("kind"),
    alt: text("alt"),
    sort: integer("sort").default(0),
    assetId: text("asset_id"),
  }
}
