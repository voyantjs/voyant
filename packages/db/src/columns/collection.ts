import { boolean, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Collection columns shared between db-main and db-marketplace
 */

/**
 * Core columns for collections table
 */
export function collectionCoreColumns() {
  return {
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    definition: jsonb("definition").notNull().default({}),
    seo: jsonb("seo").notNull().default({}),
    heroMedia: jsonb("hero_media"),
    sourceRef: text("source_ref"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
}

/**
 * Core columns for collection_items table
 */
export function collectionItemsCoreColumns() {
  return {
    rank: integer("rank").notNull().default(0),
    pinned: boolean("pinned").notNull().default(false),
    excluded: boolean("excluded").notNull().default(false),
    computedAt: timestamp("computed_at", { withTimezone: true }),
    reason: text("reason"),
  }
}

/**
 * Core columns for collection_translations table
 */
export function collectionTranslationsCoreColumns() {
  return {
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    slug: text("slug"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  }
}
