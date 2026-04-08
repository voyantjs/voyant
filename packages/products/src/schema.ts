import { typeId, typeIdRef } from "@voyantjs/db/lib/typeid-column"
import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"])
export const productOptionStatusEnum = pgEnum("product_option_status", [
  "draft",
  "active",
  "archived",
])
export const optionUnitTypeEnum = pgEnum("option_unit_type", [
  "person",
  "group",
  "room",
  "vehicle",
  "service",
  "other",
])
export const productBookingModeEnum = pgEnum("product_booking_mode", [
  "date",
  "date_time",
  "open",
  "stay",
  "transfer",
  "itinerary",
  "other",
])
export const productCapacityModeEnum = pgEnum("product_capacity_mode", [
  "free_sale",
  "limited",
  "on_request",
])
export const productVisibilityEnum = pgEnum("product_visibility", ["public", "private", "hidden"])
export const productActivationModeEnum = pgEnum("product_activation_mode", [
  "manual",
  "scheduled",
  "channel_controlled",
])
export const productTicketFulfillmentEnum = pgEnum("product_ticket_fulfillment", [
  "none",
  "per_booking",
  "per_participant",
  "per_item",
])
export const productDeliveryFormatEnum = pgEnum("product_delivery_format", [
  "voucher",
  "ticket",
  "pdf",
  "qr_code",
  "barcode",
  "email",
  "mobile",
  "none",
])
export const productCapabilityEnum = pgEnum("product_capability", [
  "instant_confirmation",
  "on_request",
  "pickup_available",
  "dropoff_available",
  "guided",
  "private",
  "shared",
  "digital_ticket",
  "voucher_required",
  "external_inventory",
  "multi_day",
  "accommodation",
  "transport",
])
export const productFeatureTypeEnum = pgEnum("product_feature_type", [
  "inclusion",
  "exclusion",
  "highlight",
  "important_information",
  "other",
])
export const productLocationTypeEnum = pgEnum("product_location_type", [
  "start",
  "end",
  "meeting_point",
  "pickup",
  "dropoff",
  "point_of_interest",
  "other",
])

// Inlined from suppliers to avoid cross-package schema dependency
export const serviceTypeEnum = pgEnum("service_type", [
  "accommodation",
  "transfer",
  "experience",
  "guide",
  "meal",
  "other",
])

// ---------- products ----------

export const products = pgTable(
  "products",
  {
    id: typeId("products"),

    name: text("name").notNull(),
    status: productStatusEnum("status").notNull().default("draft"),
    description: text("description"),
    bookingMode: productBookingModeEnum("booking_mode").notNull().default("date"),
    capacityMode: productCapacityModeEnum("capacity_mode").notNull().default("limited"),
    timezone: text("timezone"),
    visibility: productVisibilityEnum("visibility").notNull().default("private"),
    activated: boolean("activated").notNull().default(false),
    reservationTimeoutMinutes: integer("reservation_timeout_minutes"),

    // Pricing
    sellCurrency: text("sell_currency").notNull(),
    sellAmountCents: integer("sell_amount_cents"),
    costAmountCents: integer("cost_amount_cents"),
    marginPercent: integer("margin_percent"),

    // Client link — person/organization associations now live in cross-module link tables
    // (see `defineLink(crmModule.linkable.person, productsModule.linkable.product)`).
    facilityId: text("facility_id"),

    // Trip details
    startDate: date("start_date"),
    endDate: date("end_date"),
    pax: integer("pax"),

    // Taxonomy
    productTypeId: text("product_type_id"),

    // Metadata
    tags: jsonb("tags").$type<string[]>().default([]),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_products_status").on(table.status),
    index("idx_products_facility").on(table.facilityId),
    index("idx_products_product_type").on(table.productTypeId),
  ],
)

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

// ---------- product_options ----------

export const productOptions = pgTable(
  "product_options",
  {
    id: typeId("product_options"),
    productId: typeIdRef("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    code: text("code"),
    description: text("description"),
    status: productOptionStatusEnum("status").notNull().default("draft"),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    availableFrom: date("available_from"),
    availableTo: date("available_to"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_options_product").on(table.productId),
    index("idx_product_options_status").on(table.status),
    index("idx_product_options_default").on(table.isDefault),
    uniqueIndex("uidx_product_options_product_code").on(table.productId, table.code),
  ],
)

export type ProductOption = typeof productOptions.$inferSelect
export type NewProductOption = typeof productOptions.$inferInsert

// ---------- option_units ----------

export const optionUnits = pgTable(
  "option_units",
  {
    id: typeId("option_units"),
    optionId: typeIdRef("option_id")
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    code: text("code"),
    description: text("description"),
    unitType: optionUnitTypeEnum("unit_type").notNull().default("person"),
    minQuantity: integer("min_quantity"),
    maxQuantity: integer("max_quantity"),
    minAge: integer("min_age"),
    maxAge: integer("max_age"),
    occupancyMin: integer("occupancy_min"),
    occupancyMax: integer("occupancy_max"),
    isRequired: boolean("is_required").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_option_units_option").on(table.optionId),
    index("idx_option_units_type").on(table.unitType),
    uniqueIndex("uidx_option_units_option_code").on(table.optionId, table.code),
  ],
)

export type OptionUnit = typeof optionUnits.$inferSelect
export type NewOptionUnit = typeof optionUnits.$inferInsert

// ---------- product operating configuration ----------

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

// ---------- structured content ----------

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

// ---------- translations ----------

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

// ---------- product_days ----------

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

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_product_days_product").on(table.productId)],
)

export type ProductDay = typeof productDays.$inferSelect
export type NewProductDay = typeof productDays.$inferInsert

// ---------- product_day_services ----------

export const productDayServices = pgTable(
  "product_day_services",
  {
    id: typeId("product_day_services"),
    dayId: typeIdRef("day_id")
      .notNull()
      .references(() => productDays.id, { onDelete: "cascade" }),

    // Supplier link (snapshot)
    supplierServiceId: text("supplier_service_id"),

    serviceType: serviceTypeEnum("service_type").notNull(),
    name: text("name").notNull(),
    description: text("description"),

    // Cost (independent currency per service)
    costCurrency: text("cost_currency").notNull(),
    costAmountCents: integer("cost_amount_cents").notNull(),
    quantity: integer("quantity").notNull().default(1),

    sortOrder: integer("sort_order"),
    notes: text("notes"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_day_services_day").on(table.dayId),
    index("idx_product_day_services_supplier_service").on(table.supplierServiceId),
  ],
)

export type ProductDayService = typeof productDayServices.$inferSelect
export type NewProductDayService = typeof productDayServices.$inferInsert

// ---------- product_versions ----------

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

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_product_versions_product").on(table.productId)],
)

export type ProductVersion = typeof productVersions.$inferSelect
export type NewProductVersion = typeof productVersions.$inferInsert

// ---------- product_notes ----------

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

// ---------- product_media ----------

export const productMediaTypeEnum = pgEnum("product_media_type", ["image", "video", "document"])

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

// ---------- product_types ----------

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

// ---------- product_categories ----------

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

// ---------- product_tags ----------

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

// ---------- product_category_products (junction) ----------

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

// ---------- product_tag_products (junction) ----------

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

// ---------- relations ----------

export const productsRelations = relations(products, ({ one, many }) => ({
  productType: one(productTypes, {
    fields: [products.productTypeId],
    references: [productTypes.id],
  }),
  activationSettings: many(productActivationSettings),
  ticketSettings: many(productTicketSettings),
  visibilitySettings: many(productVisibilitySettings),
  capabilities: many(productCapabilities),
  deliveryFormats: many(productDeliveryFormats),
  features: many(productFeatures),
  faqs: many(productFaqs),
  locations: many(productLocations),
  options: many(productOptions),
  translations: many(productTranslations),
  days: many(productDays),
  versions: many(productVersions),
  notes: many(productNotes),
  media: many(productMedia),
  categoryLinks: many(productCategoryProducts),
  tagLinks: many(productTagProducts),
}))

export const productOptionsRelations = relations(productOptions, ({ one, many }) => ({
  product: one(products, { fields: [productOptions.productId], references: [products.id] }),
  translations: many(productOptionTranslations),
  units: many(optionUnits),
}))

export const optionUnitsRelations = relations(optionUnits, ({ one, many }) => ({
  option: one(productOptions, { fields: [optionUnits.optionId], references: [productOptions.id] }),
  translations: many(optionUnitTranslations),
}))

export const productActivationSettingsRelations = relations(
  productActivationSettings,
  ({ one }) => ({
    product: one(products, {
      fields: [productActivationSettings.productId],
      references: [products.id],
    }),
  }),
)

export const productTicketSettingsRelations = relations(productTicketSettings, ({ one }) => ({
  product: one(products, {
    fields: [productTicketSettings.productId],
    references: [products.id],
  }),
}))

export const productVisibilitySettingsRelations = relations(
  productVisibilitySettings,
  ({ one }) => ({
    product: one(products, {
      fields: [productVisibilitySettings.productId],
      references: [products.id],
    }),
  }),
)

export const productCapabilitiesRelations = relations(productCapabilities, ({ one }) => ({
  product: one(products, {
    fields: [productCapabilities.productId],
    references: [products.id],
  }),
}))

export const productDeliveryFormatsRelations = relations(productDeliveryFormats, ({ one }) => ({
  product: one(products, {
    fields: [productDeliveryFormats.productId],
    references: [products.id],
  }),
}))

export const productFeaturesRelations = relations(productFeatures, ({ one }) => ({
  product: one(products, {
    fields: [productFeatures.productId],
    references: [products.id],
  }),
}))

export const productFaqsRelations = relations(productFaqs, ({ one }) => ({
  product: one(products, {
    fields: [productFaqs.productId],
    references: [products.id],
  }),
}))

export const productLocationsRelations = relations(productLocations, ({ one }) => ({
  product: one(products, {
    fields: [productLocations.productId],
    references: [products.id],
  }),
}))

export const productTranslationsRelations = relations(productTranslations, ({ one }) => ({
  product: one(products, {
    fields: [productTranslations.productId],
    references: [products.id],
  }),
}))

export const productOptionTranslationsRelations = relations(
  productOptionTranslations,
  ({ one }) => ({
    option: one(productOptions, {
      fields: [productOptionTranslations.optionId],
      references: [productOptions.id],
    }),
  }),
)

export const optionUnitTranslationsRelations = relations(optionUnitTranslations, ({ one }) => ({
  unit: one(optionUnits, {
    fields: [optionUnitTranslations.unitId],
    references: [optionUnits.id],
  }),
}))

export const productDaysRelations = relations(productDays, ({ one, many }) => ({
  product: one(products, { fields: [productDays.productId], references: [products.id] }),
  services: many(productDayServices),
  media: many(productMedia),
}))

export const productDayServicesRelations = relations(productDayServices, ({ one }) => ({
  day: one(productDays, { fields: [productDayServices.dayId], references: [productDays.id] }),
}))

export const productVersionsRelations = relations(productVersions, ({ one }) => ({
  product: one(products, { fields: [productVersions.productId], references: [products.id] }),
}))

export const productNotesRelations = relations(productNotes, ({ one }) => ({
  product: one(products, { fields: [productNotes.productId], references: [products.id] }),
}))

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, { fields: [productMedia.productId], references: [products.id] }),
  day: one(productDays, { fields: [productMedia.dayId], references: [productDays.id] }),
}))

export const productTypesRelations = relations(productTypes, ({ many }) => ({
  products: many(products),
}))

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  parent: one(productCategories, {
    fields: [productCategories.parentId],
    references: [productCategories.id],
    relationName: "parentChild",
  }),
  children: many(productCategories, { relationName: "parentChild" }),
  productLinks: many(productCategoryProducts),
}))

export const productTagsRelations = relations(productTags, ({ many }) => ({
  productLinks: many(productTagProducts),
}))

export const productCategoryProductsRelations = relations(productCategoryProducts, ({ one }) => ({
  product: one(products, {
    fields: [productCategoryProducts.productId],
    references: [products.id],
  }),
  category: one(productCategories, {
    fields: [productCategoryProducts.categoryId],
    references: [productCategories.id],
  }),
}))

export const productTagProductsRelations = relations(productTagProducts, ({ one }) => ({
  product: one(products, {
    fields: [productTagProducts.productId],
    references: [products.id],
  }),
  tag: one(productTags, {
    fields: [productTagProducts.tagId],
    references: [productTags.id],
  }),
}))
