export const PRODUCT_TYPES = [
  "tour",
  "experience",
  "package",
  "accommodation",
  "cruise",
  "pilgrimage",
  "excursion",
  "city-break",
] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export const DEPARTURE_STATUSES = ["scheduled", "on_sale", "sold_out", "cancelled"] as const
export type DepartureStatus = (typeof DEPARTURE_STATUSES)[number]

export const SOURCE_KINDS = ["organization", "external_provider"] as const
export type SourceKind = (typeof SOURCE_KINDS)[number]

export const OWNER_KINDS = ["organization", "provider"] as const
export type OwnerKind = (typeof OWNER_KINDS)[number]

export const PUBLICATION_ENTITY_TYPES = ["product", "departure"] as const
export type PublicationEntityType = (typeof PUBLICATION_ENTITY_TYPES)[number]

// Source types for overrides (same as SOURCE_KINDS but used in product_overrides context)
export const SOURCE_TYPES = ["organization", "external_provider"] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

// Fitness levels for booking rules
export const FITNESS_LEVELS = ["none", "low", "moderate", "high", "extreme"] as const
export type FitnessLevel = (typeof FITNESS_LEVELS)[number]

// Price kinds for catalog pricing
export const PRICE_KINDS = ["base", "discount", "fee", "tax"] as const
export type PriceKind = (typeof PRICE_KINDS)[number]

// Availability statuses
export const AVAILABILITY_STATUSES = [
  "open",
  "waitlist",
  "closed",
  "booked_out",
  "on_request",
] as const
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number]

// Blackout reasons
export const BLACKOUT_REASONS = [
  "maintenance",
  "weather",
  "staff_unavailable",
  "equipment_issue",
  "seasonal_closure",
  "private_event",
  "other",
] as const
export type BlackoutReason = (typeof BLACKOUT_REASONS)[number]

// Dietary options
export const DIETARY_OPTIONS = [
  "vegetarian",
  "vegan",
  "gluten_free",
  "dairy_free",
  "nut_free",
  "halal",
  "kosher",
  "pescatarian",
  "low_sodium",
  "diabetic",
  "other",
] as const
export type DietaryOption = (typeof DIETARY_OPTIONS)[number]

// Accessibility support options
export const ACCESSIBILITY_SUPPORT_OPTIONS = [
  "wheelchair",
  "mobility_aid",
  "hearing_loop",
  "sign_language",
  "visual_aids",
  "service_animal",
  "elevator_access",
  "accessible_restroom",
  "braille",
  "audio_description",
] as const
export type AccessibilitySupport = (typeof ACCESSIBILITY_SUPPORT_OPTIONS)[number]

// Rate plan channels
export const RATE_PLAN_CHANNELS = ["website", "admin", "api", "marketplace"] as const
export type RatePlanChannel = (typeof RATE_PLAN_CHANNELS)[number]

// Rate plan channel statuses
export const RATE_PLAN_CHANNEL_STATUSES = ["active", "hidden"] as const
export type RatePlanChannelStatus = (typeof RATE_PLAN_CHANNEL_STATUSES)[number]

// Extension positions
export const EXTENSION_POSITIONS = ["pre", "post"] as const
export type ExtensionPosition = (typeof EXTENSION_POSITIONS)[number]

// Extension ref sources
export const EXTENSION_REF_SOURCES = ["own", "provider"] as const
export type ExtensionRefSource = (typeof EXTENSION_REF_SOURCES)[number]

// Category assignment sources
export const CATEGORY_ASSIGNMENT_SOURCES = ["manual", "auto", "provider_map"] as const
export type CategoryAssignmentSource = (typeof CATEGORY_ASSIGNMENT_SOURCES)[number]

// Collection statuses
export const COLLECTION_STATUSES = ["active", "draft", "archived"] as const
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number]

// Collection types
export const COLLECTION_TYPES = ["manual", "smart"] as const
export type CollectionType = (typeof COLLECTION_TYPES)[number]

// Collection sort strategies
export const COLLECTION_SORT_STRATEGIES = [
  "manual",
  "newest",
  "price_asc",
  "price_desc",
  "random",
  "custom",
] as const
export type CollectionSortStrategy = (typeof COLLECTION_SORT_STRATEGIES)[number]

// Collection item types
export const COLLECTION_ITEM_TYPES = ["product"] as const
export type CollectionItemType = (typeof COLLECTION_ITEM_TYPES)[number]

// Collection item sources
export const COLLECTION_ITEM_SOURCES = ["manual", "rule", "override"] as const
export type CollectionItemSource = (typeof COLLECTION_ITEM_SOURCES)[number]
