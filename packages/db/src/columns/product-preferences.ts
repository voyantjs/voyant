import { boolean, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Core product preferences columns shared between db-main and db-marketplace.
 *
 * Use spread operator to include in table definitions:
 * @example
 * const productPreferencesTable = pgTable("product_preferences", {
 *   id: typeId("product_preferences"),
 *   productId: typeIdRef("product_id").notNull().references(...).unique(),
 *   ...productPreferencesCoreColumns(),
 * })
 */
export function productPreferencesCoreColumns() {
  return {
    // Dietary options
    dietaryOptions: jsonb("dietary_options").$type<string[]>(),
    dietaryRequired: boolean("dietary_required").default(false),
    dietaryNotes: text("dietary_notes"),
    // Accessibility support
    accessibilitySupport: jsonb("accessibility_support").$type<string[]>(),
    accessibilityRequired: boolean("accessibility_required").default(false),
    accessibilityNotes: text("accessibility_notes"),
    // Language options
    languageOptions: jsonb("language_options").$type<string[]>(),
    defaultLanguage: text("default_language"),
    languageRequired: boolean("language_required").default(false),
    languageNotes: text("language_notes"),
    // Age groups/suitability
    ageGroups: jsonb("age_groups").$type<string[]>(),
    ageGroupNotes: text("age_group_notes"),
    // Special requests
    allowSpecialRequests: boolean("allow_special_requests").default(true),
    specialRequestsPrompt: text("special_requests_prompt"),
    specialRequestsRequired: boolean("special_requests_required").default(false),
    // Medical/health
    requiresMedicalInfo: boolean("requires_medical_info").default(false),
    medicalInfoPrompt: text("medical_info_prompt"),
    medicalConditionsNotes: text("medical_conditions_notes"),
    // Emergency contact
    requiresEmergencyContact: boolean("requires_emergency_contact").default(true),
    emergencyContactNotes: text("emergency_contact_notes"),
    // Travel documents
    requiresPassportInfo: boolean("requires_passport_info").default(false),
    requiresVisaInfo: boolean("requires_visa_info").default(false),
    travelDocumentNotes: text("travel_document_notes"),
    // Preferences collection points
    collectAtBooking: boolean("collect_at_booking").default(true),
    collectPreDeparture: boolean("collect_pre_departure").default(false),
    preDepartureDays: integer("pre_departure_days").default(30),
    // Custom fields
    customFields:
      jsonb("custom_fields").$type<
        Array<{
          key: string
          label: string
          type: "text" | "select" | "multiselect" | "boolean" | "number"
          options?: string[]
          required: boolean
          helpText?: string
        }>
      >(),
    // Active flag
    active: boolean("active").notNull().default(true),
    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
}
