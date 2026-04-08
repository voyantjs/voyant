import { boolean, char, date, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Lodging property core columns - shared between db-main and db-marketplace.
 * Contains common property data.
 * NOTE: status is NOT included as db-main uses text and db-marketplace uses an enum.
 */
export function lodgingPropertyCoreColumns() {
  return {
    code: text("code"),
    name: text("name").notNull(),
    nickname: text("nickname"),
    description: text("description"),
    defaultCurrency: char("default_currency", { length: 3 }),
    timezone: text("timezone"),
    contacts: jsonb("contacts"),
    address: jsonb("address"),
    geoPoint: jsonb("geo_point"),
    stars: integer("stars"),
    propertyType: text("property_type"),
    active: boolean("active").default(true),
    version: integer("version").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Property rooms core columns - shared between db-main and db-marketplace.
 * Contains property room type data.
 * NOTE: status is NOT included as db-main uses text and db-marketplace uses an enum.
 */
export function lodgingPropertyRoomsCoreColumns() {
  return {
    code: text("code"),
    nameDefault: text("name_default").notNull(),
    descriptionDefault: text("description_default"),
    occupancyAdultsMin: integer("occupancy_adults_min").default(1),
    occupancyAdultsMax: integer("occupancy_adults_max").default(2),
    occupancyChildrenMin: integer("occupancy_children_min").default(0),
    occupancyChildrenMax: integer("occupancy_children_max").default(0),
    occupancyInfantsMax: integer("occupancy_infants_max").default(0),
    beds: jsonb("beds"),
    sizeM2: integer("size_m2"),
    view: text("view"),
    smokingPolicy: text("smoking_policy"),
    baseCurrency: char("base_currency", { length: 3 }),
    attributes: jsonb("attributes").default({}),
    version: integer("version").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Lodging rate plans core columns - shared between db-main and db-marketplace.
 * Contains rate plan data.
 * NOTE: status is NOT included as db-main uses text and db-marketplace uses an enum.
 */
export function lodgingRatePlansCoreColumns() {
  return {
    code: text("code"),
    nameDefault: text("name_default").notNull(),
    descriptionDefault: text("description_default"),
    mealPlan: text("meal_plan"),
    prepaymentRequired: boolean("prepayment_required"),
    advancePurchaseDaysMin: integer("advance_purchase_days_min"),
    version: integer("version").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}

/**
 * Property media core columns - shared between db-main and db-marketplace.
 * Contains media asset references.
 */
export function lodgingPropertyMediaCoreColumns() {
  return {
    assetId: text("asset_id"),
    url: text("url"),
    captionDefault: text("caption_default"),
    sort: integer("sort").default(0),
  }
}

/**
 * Property room media core columns - shared between db-main and db-marketplace.
 * Contains media asset references for property rooms.
 */
export function lodgingPropertyRoomMediaCoreColumns() {
  return {
    assetId: text("asset_id"),
    url: text("url"),
    captionDefault: text("caption_default"),
    sort: integer("sort").default(0),
  }
}

/**
 * Property translation core columns - shared between db-main and db-marketplace.
 * Contains translatable property fields.
 */
export function lodgingPropertyTranslationCoreColumns() {
  return {
    locale: text("locale").notNull(),
    name: text("name"),
    shortDescription: text("short_description"),
    description: text("description"),
    slug: text("slug"),
  }
}

/**
 * Property room translation core columns - shared between db-main and db-marketplace.
 * Contains translatable property room fields.
 */
export function lodgingPropertyRoomTranslationCoreColumns() {
  return {
    locale: text("locale").notNull(),
    name: text("name"),
    shortDescription: text("short_description"),
    description: text("description"),
    amenities: jsonb("amenities").$type<string[]>().default([]),
  }
}

/**
 * Rate plan translation core columns - shared between db-main and db-marketplace.
 * Contains translatable rate plan fields.
 */
export function lodgingRatePlanTranslationCoreColumns() {
  return {
    locale: text("locale").notNull(),
    name: text("name"),
    shortDescription: text("short_description"),
    description: text("description"),
  }
}

/**
 * Property room rate plan core columns - shared between db-main and db-marketplace.
 * Links property rooms to rate plans with optional activation dates.
 */
export function lodgingPropertyRoomRatePlanCoreColumns() {
  return {
    activeFrom: timestamp("active_from", { withTimezone: true }),
    activeUntil: timestamp("active_until", { withTimezone: true }),
  }
}

/**
 * Property daily rate core columns - shared between db-main and db-marketplace.
 * Daily pricing for room + rate plan combinations.
 */
export function lodgingPropertyDailyRateCoreColumns() {
  return {
    date: date("date").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    extraAdultAmountMinor: integer("extra_adult_amount_minor"),
    childAmountMinor: integer("child_amount_minor"),
    infantAmountMinor: integer("infant_amount_minor"),
    minStay: integer("min_stay").default(1),
    maxStay: integer("max_stay"),
    closedToArrival: boolean("closed_to_arrival").default(false),
    closedToDeparture: boolean("closed_to_departure").default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
}
