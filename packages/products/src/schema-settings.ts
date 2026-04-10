import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { optionUnits, productOptions, products } from "./schema-core"
import {
  productActivationModeEnum,
  productCapabilityEnum,
  productDeliveryFormatEnum,
  productFeatureTypeEnum,
  productLocationTypeEnum,
  productTicketFulfillmentEnum,
} from "./schema-shared"

export const productActivationSettings = pgTable(
  "product_activation_settings",
  {
    id: typeId("product_activation_settings"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    activationMode: productActivationModeEnum("activation_mode").notNull().default("manual"),
    activateAt: timestamp("activate_at", { withTimezone: true }),
    deactivateAt: timestamp("deactivate_at", { withTimezone: true }),
    sellAt: timestamp("sell_at", { withTimezone: true }),
    stopSellAt: timestamp("stop_sell_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uidx_product_activation_settings_product").on(table.productId),
    index("idx_product_activation_settings_mode").on(table.activationMode),
  ],
)

export const productTicketSettings = pgTable(
  "product_ticket_settings",
  {
    id: typeId("product_ticket_settings"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    fulfillmentMode: productTicketFulfillmentEnum("fulfillment_mode").notNull().default("none"),
    defaultDeliveryFormat: productDeliveryFormatEnum("default_delivery_format")
      .notNull()
      .default("none"),
    ticketPerUnit: boolean("ticket_per_unit").notNull().default(false),
    barcodeFormat: text("barcode_format"),
    voucherMessage: text("voucher_message"),
    ticketMessage: text("ticket_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uidx_product_ticket_settings_product").on(table.productId)],
)

export const productVisibilitySettings = pgTable(
  "product_visibility_settings",
  {
    id: typeId("product_visibility_settings"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    isSearchable: boolean("is_searchable").notNull().default(false),
    isBookable: boolean("is_bookable").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    requiresAuthentication: boolean("requires_authentication").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("uidx_product_visibility_settings_product").on(table.productId)],
)

export const productCapabilities = pgTable(
  "product_capabilities",
  {
    id: typeId("product_capabilities"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    capability: productCapabilityEnum("capability").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_capabilities_product").on(table.productId),
    index("idx_product_capabilities_capability").on(table.capability),
    uniqueIndex("uidx_product_capabilities_product_capability").on(
      table.productId,
      table.capability,
    ),
  ],
)

export const productDeliveryFormats = pgTable(
  "product_delivery_formats",
  {
    id: typeId("product_delivery_formats"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    format: productDeliveryFormatEnum("format").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_delivery_formats_product").on(table.productId),
    uniqueIndex("uidx_product_delivery_formats_product_format").on(table.productId, table.format),
  ],
)

export type ProductActivationSetting = typeof productActivationSettings.$inferSelect
export type NewProductActivationSetting = typeof productActivationSettings.$inferInsert
export type ProductTicketSetting = typeof productTicketSettings.$inferSelect
export type NewProductTicketSetting = typeof productTicketSettings.$inferInsert
export type ProductVisibilitySetting = typeof productVisibilitySettings.$inferSelect
export type NewProductVisibilitySetting = typeof productVisibilitySettings.$inferInsert
export type ProductCapability = typeof productCapabilities.$inferSelect
export type NewProductCapability = typeof productCapabilities.$inferInsert
export type ProductDeliveryFormat = typeof productDeliveryFormats.$inferSelect
export type NewProductDeliveryFormat = typeof productDeliveryFormats.$inferInsert

export const productFeatures = pgTable(
  "product_features",
  {
    id: typeId("product_features"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    featureType: productFeatureTypeEnum("feature_type").notNull().default("highlight"),
    title: text("title").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_features_product").on(table.productId),
    index("idx_product_features_type").on(table.featureType),
  ],
)

export const productFaqs = pgTable(
  "product_faqs",
  {
    id: typeId("product_faqs"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_product_faqs_product").on(table.productId)],
)

export const productLocations = pgTable(
  "product_locations",
  {
    id: typeId("product_locations"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locationType: productLocationTypeEnum("location_type").notNull().default("point_of_interest"),
    title: text("title").notNull(),
    address: text("address"),
    city: text("city"),
    countryCode: text("country_code"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    googlePlaceId: text("google_place_id"),
    applePlaceId: text("apple_place_id"),
    tripadvisorLocationId: text("tripadvisor_location_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_locations_product").on(table.productId),
    index("idx_product_locations_type").on(table.locationType),
  ],
)

export type ProductFeature = typeof productFeatures.$inferSelect
export type NewProductFeature = typeof productFeatures.$inferInsert
export type ProductFaq = typeof productFaqs.$inferSelect
export type NewProductFaq = typeof productFaqs.$inferInsert
export type ProductLocation = typeof productLocations.$inferSelect
export type NewProductLocation = typeof productLocations.$inferInsert

export const productTranslations = pgTable(
  "product_translations",
  {
    id: typeId("product_translations"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    languageTag: text("language_tag").notNull(),
    slug: text("slug"),
    name: text("name").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_translations_product").on(table.productId),
    index("idx_product_translations_language").on(table.languageTag),
    uniqueIndex("uidx_product_translations_product_language").on(
      table.productId,
      table.languageTag,
    ),
  ],
)

export const productOptionTranslations = pgTable(
  "product_option_translations",
  {
    id: typeId("product_option_translations"),
    optionId: typeIdRef("option_id")
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    languageTag: text("language_tag").notNull(),
    name: text("name").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_option_translations_option").on(table.optionId),
    index("idx_product_option_translations_language").on(table.languageTag),
    uniqueIndex("uidx_product_option_translations_option_language").on(
      table.optionId,
      table.languageTag,
    ),
  ],
)

export const optionUnitTranslations = pgTable(
  "option_unit_translations",
  {
    id: typeId("option_unit_translations"),
    unitId: typeIdRef("unit_id")
      .notNull()
      .references(() => optionUnits.id, { onDelete: "cascade" }),
    languageTag: text("language_tag").notNull(),
    name: text("name").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_option_unit_translations_unit").on(table.unitId),
    index("idx_option_unit_translations_language").on(table.languageTag),
    uniqueIndex("uidx_option_unit_translations_unit_language").on(table.unitId, table.languageTag),
  ],
)

export type ProductTranslation = typeof productTranslations.$inferSelect
export type NewProductTranslation = typeof productTranslations.$inferInsert
export type ProductOptionTranslation = typeof productOptionTranslations.$inferSelect
export type NewProductOptionTranslation = typeof productOptionTranslations.$inferInsert
export type OptionUnitTranslation = typeof optionUnitTranslations.$inferSelect
export type NewOptionUnitTranslation = typeof optionUnitTranslations.$inferInsert
