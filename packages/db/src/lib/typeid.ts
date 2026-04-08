// /packages/db/src/lib/typeid.ts
// TypeID utility for generating time-sortable, prefixed identifiers
// Uses UUIDv7 under the hood for natural chronological ordering

import { TypeID, typeid } from "typeid-js"
import { z } from "zod"

/**
 * All entity prefixes for the Voyant platform.
 * Prefixes are 2-4 characters, lowercase alphanumeric.
 */
export const PREFIXES = {
  // --- IAM ---
  user_profiles: "usrp",
  connection_secrets: "secr",

  // --- INFRA ---
  webhook_subscriptions: "hksub",
  webhook_deliveries: "whde",
  domains: "dom",
  email_domain_records: "emdr",

  // --- VOYANT MODULES ---
  communication_log: "clog",
  notification_templates: "ntpl",
  notification_deliveries: "ntdl",
  notification_reminder_rules: "ntrl",
  notification_reminder_runs: "ntrn",
  person_notes: "pnot",
  organization_notes: "onot",
  segments: "cseg",
  segment_members: "csgm",
  suppliers: "supp",
  supplier_services: "ssvc",
  supplier_rates: "srat",
  supplier_notes: "snot",
  supplier_availability: "sava",
  supplier_contracts: "scon",
  products: "prod",
  product_options: "popt",
  option_units: "ount",
  product_activation_settings: "pras",
  product_ticket_settings: "prts",
  product_visibility_settings: "prvs",
  product_capabilities: "prcp",
  product_delivery_formats: "prdf",
  product_translations: "prtr",
  product_option_translations: "potr",
  option_unit_translations: "outr",
  product_days: "pday",
  product_day_services: "pdse",
  product_versions: "pver",
  product_notes: "prnt",
  bookings: "book",
  booking_participants: "bkpt",
  booking_items: "bkit",
  booking_allocations: "bkac",
  booking_fulfillments: "bkfl",
  booking_redemption_events: "bkrd",
  booking_item_participants: "bkip",
  booking_passengers: "bkps",
  booking_supplier_statuses: "bkss",
  booking_activity_log: "bkal",
  booking_pii_access_log: "bkpl",
  booking_notes: "bnot",
  booking_documents: "bdoc",
  availability_rules: "avrl",
  availability_start_times: "avst",
  availability_slots: "avsl",
  availability_closeouts: "avcl",
  availability_pickup_points: "avpp",
  availability_slot_pickups: "avsp",
  product_meeting_configs: "pmcf",
  pickup_groups: "pkgr",
  pickup_locations: "pklo",
  location_pickup_times: "lpkt",
  custom_pickup_areas: "cpka",
  organizations: "orgn",
  people: "prsn",
  pipelines: "pipe",
  stages: "stge",
  opportunities: "oppt",
  opportunity_participants: "oppp",
  opportunity_products: "oppr",
  quotes: "quot",
  quote_lines: "qtln",
  activities: "actv",
  activity_links: "actl",
  activity_participants: "actp",
  custom_field_definitions: "cfdf",
  custom_field_values: "cfvl",
  invoices: "inv",
  payment_instruments: "pmin",
  payment_sessions: "pmss",
  payment_authorizations: "pmaz",
  payment_captures: "pmcp",
  booking_payment_schedules: "bkpy",
  booking_guarantees: "bkgu",
  booking_item_tax_lines: "bitx",
  booking_item_commissions: "bcom",
  invoice_line_items: "inli",
  payments: "pay",
  credit_notes: "crnt",
  credit_note_line_items: "cnli",
  supplier_payments: "spay",
  finance_notes: "fnot",
  resources: "resc",
  resource_pools: "rspl",
  resource_pool_members: "rspm",
  resource_requirements: "rsrq",
  resource_slot_assignments: "rssa",
  resource_closeouts: "rscl",
  ground_operators: "gopr",
  ground_vehicles: "gveh",
  ground_drivers: "gdrv",
  ground_transfer_preferences: "gtpr",
  ground_dispatches: "gdsp",
  ground_execution_events: "gexe",
  ground_dispatch_assignments: "gdas",
  ground_dispatch_legs: "gdlg",
  ground_dispatch_passengers: "gdps",
  ground_driver_shifts: "gdsh",
  ground_service_incidents: "gsin",
  ground_dispatch_checkpoints: "gdcp",
  channels: "chan",
  channel_contracts: "chco",
  channel_commission_rules: "chcr",
  channel_product_mappings: "chpm",
  channel_booking_links: "chbl",
  channel_webhook_events: "chwe",
  channel_inventory_allotments: "chia",
  channel_inventory_allotment_targets: "chat",
  channel_inventory_release_rules: "chir",
  channel_settlement_runs: "chsr",
  channel_settlement_items: "chsi",
  channel_reconciliation_runs: "chrr",
  channel_reconciliation_items: "chri",
  channel_inventory_release_executions: "chrx",
  channel_settlement_policies: "chsp",
  channel_reconciliation_policies: "chrp",
  channel_release_schedules: "chrs",
  channel_remittance_exceptions: "chre",
  channel_settlement_approvals: "chap",
  facilities: "faci",
  facility_contacts: "fcon",
  facility_features: "ffea",
  facility_operation_schedules: "fops",
  properties: "prop",
  property_groups: "pgrp",
  property_group_members: "pgpm",
  room_types: "hrmt",
  room_type_bed_configs: "hrbc",
  room_units: "hrun",
  meal_plans: "hmlp",
  rate_plans: "hrpl",
  rate_plan_room_types: "hrrt",
  stay_rules: "hstr",
  room_inventory: "hriv",
  rate_plan_inventory_overrides: "hrio",
  stay_booking_items: "hsbi",
  stay_daily_rates: "hsdr",
  room_type_rates: "hrtr",
  room_blocks: "hrbl",
  room_unit_status_events: "hrse",
  maintenance_blocks: "hmbl",
  housekeeping_tasks: "hhkt",
  stay_operations: "hsop",
  stay_checkpoints: "hscp",
  stay_service_posts: "hssp",
  stay_folios: "hsfo",
  stay_folio_lines: "hsfl",
  identity_contact_points: "idcp",
  identity_addresses: "idad",
  identity_named_contacts: "idnc",
  markets: "mrkt",
  market_locales: "mklo",
  market_currencies: "mkcu",
  fx_rate_sets: "fxrs",
  exchange_rates: "fxrt",
  pricing_categories: "prcg",
  pricing_category_dependencies: "prcd",
  cancellation_policies: "ccpo",
  cancellation_policy_rules: "ccpr",
  price_catalogs: "prca",
  price_schedules: "prsc",
  option_price_rules: "oprr",
  option_unit_price_rules: "oupr",
  option_start_time_rules: "ostr",
  option_unit_tiers: "outi",
  pickup_price_rules: "pkpr",
  dropoff_price_rules: "drpr",
  extra_price_rules: "expr",
  product_extras: "pxtr",
  option_extra_configs: "oexc",
  booking_extras: "bkex",
  product_contact_requirements: "pcre",
  product_booking_questions: "pbqq",
  option_booking_questions: "obqq",
  booking_question_options: "bqop",
  booking_question_unit_triggers: "bqut",
  booking_question_option_triggers: "bqot",
  booking_question_extra_triggers: "bqet",
  booking_answers: "bqan",
  offers: "offr",
  offer_participants: "ofpt",
  offer_items: "ofit",
  offer_item_participants: "ofip",
  orders: "ordr",
  order_participants: "orpt",
  order_items: "orit",
  order_item_participants: "orip",
  order_terms: "ortm",
  transaction_pii_access_log: "tpal",
  market_price_catalogs: "mkpc",
  market_product_rules: "mkpr",
  market_channel_rules: "mkcr",
  external_refs: "exrf",
  sellability_snapshots: "sels",
  sellability_snapshot_items: "sesi",
  sellability_policies: "slpo",
  sellability_policy_results: "slpr",
  offer_refresh_runs: "ofrr",
  offer_expiration_events: "ofee",
  sellability_explanations: "slex",

  // --- CONTRACTS ---
  contracts: "cont",
  contract_templates: "ctpl",
  contract_template_versions: "ctpv",
  contract_signatures: "ctsi",
  contract_number_series: "ctns",
  contract_attachments: "ctat",

  // --- POLICIES ---
  policies: "poli",
  policy_versions: "plvr",
  policy_rules: "plrl",
  policy_assignments: "plas",
  policy_acceptances: "plac",

  // --- FINANCE (invoicing extensions) ---
  invoice_number_series: "invs",
  invoice_templates: "invt",
  invoice_renditions: "invr",
  tax_regimes: "txrg",
  invoice_external_refs: "iner",

  // --- PRODUCT MEDIA ---
  product_media: "pmed",
  product_features: "pftr",
  product_faqs: "pfaq",
  product_locations: "ploc",

  // --- PRODUCT TAXONOMY ---
  product_types: "ptyp",
  product_categories: "pctg",
  product_tags: "ptag",

  // --- BOOKING EXTENSIONS ---
  booking_product_details: "bkpd",
  booking_item_product_details: "bipd",
  booking_crm_details: "bkcd",
  booking_transaction_details: "bktd",
  booking_distribution_details: "bkdd",
  booking_participant_travel_details: "bptd",
} as const

/**
 * Type representing all valid prefix keys
 */
export type PrefixKey = keyof typeof PREFIXES

/**
 * Type representing all valid prefix values
 */
export type PrefixValue = (typeof PREFIXES)[PrefixKey]

/**
 * Register a custom TypeID prefix for extension tables.
 *
 * @param tableName - The table/entity name
 * @param prefix - The 2-4 character prefix
 */
export function registerPrefix(tableName: string, prefix: string): void {
  if ((PREFIXES as Record<string, string>)[tableName]) {
    throw new Error(`Prefix already registered for table "${tableName}"`)
  }
  const existingValues = Object.values(PREFIXES)
  if (existingValues.includes(prefix as PrefixValue)) {
    throw new Error(`Prefix "${prefix}" is already in use`)
  }
  ;(PREFIXES as Record<string, string>)[tableName] = prefix
}

/**
 * Generates a new TypeID with the correct prefix.
 * Uses UUIDv7 automatically (time-sortable).
 *
 * @param prefix - The entity type key from PREFIXES
 * @returns A TypeID string like "usrp_01H8Z3Y4X2..."
 */
export function newId(prefix: PrefixKey): string {
  return typeid(PREFIXES[prefix]).toString()
}

/**
 * Generates a new TypeID using a raw prefix string.
 *
 * @param prefix - The raw prefix string (e.g., "usrp")
 * @returns A TypeID string
 */
export function newIdFromPrefix(prefix: string): string {
  return typeid(prefix).toString()
}

/**
 * Decodes a TypeID string to extract its components.
 */
export function decodeId<T extends string>(id: string, expectedPrefix: T): TypeID<T>
export function decodeId(id: string): TypeID<string>
export function decodeId<T extends string>(
  id: string,
  expectedPrefix?: T,
): TypeID<T> | TypeID<string> {
  if (expectedPrefix) {
    return TypeID.fromString(id, expectedPrefix)
  }
  return TypeID.fromString(id)
}

/**
 * Validates that a string is a valid TypeID with the expected prefix.
 */
export function isValidId(id: string, expectedPrefix: PrefixKey | PrefixValue): boolean {
  try {
    const decoded = decodeId(id)
    const prefix =
      expectedPrefix in PREFIXES ? PREFIXES[expectedPrefix as PrefixKey] : expectedPrefix
    return decoded.getType() === prefix
  } catch {
    return false
  }
}

/**
 * Extracts the prefix from a TypeID string.
 */
export function getPrefix(id: string): string {
  return decodeId(id).getType()
}

/**
 * Extracts the timestamp from a TypeID (UUIDv7 encodes creation time).
 */
export function getTimestamp(id: string): Date {
  const decoded = decodeId(id)
  const uuid = decoded.toUUID()
  const hex = uuid.replace(/-/g, "").slice(0, 12)
  const ms = parseInt(hex, 16)
  return new Date(ms)
}

/**
 * Compares two TypeIDs chronologically.
 */
export function compareIds(a: string, b: string): number {
  return a.localeCompare(b)
}

// ============================================================================
// Zod Schema Helpers
// ============================================================================

const TYPEID_SUFFIX_PATTERN = "[0-9a-hjkmnp-tv-z]{26}"

/**
 * Creates a Zod schema for validating TypeIDs with a specific prefix.
 */
export function typeIdSchema(prefix: PrefixKey | PrefixValue) {
  const prefixValue = prefix in PREFIXES ? PREFIXES[prefix as PrefixKey] : prefix
  const pattern = new RegExp(`^${prefixValue}_${TYPEID_SUFFIX_PATTERN}$`)

  return z.string().regex(pattern, {
    message: `Invalid TypeID: expected prefix "${prefixValue}_"`,
  })
}

/**
 * Creates a Zod schema for validating any TypeID.
 */
export function anyTypeIdSchema() {
  const pattern = new RegExp(`^[a-z][a-z0-9]{0,62}_${TYPEID_SUFFIX_PATTERN}$`)

  return z.string().regex(pattern, {
    message: "Invalid TypeID format",
  })
}

/**
 * Creates a Zod schema that accepts either a TypeID or null/undefined.
 */
export function typeIdSchemaOptional(prefix: PrefixKey | PrefixValue) {
  return typeIdSchema(prefix).nullable().optional()
}

/**
 * Pre-built Zod schemas for common entity types.
 */
export const typeIdSchemas = {
  userProfile: typeIdSchema("user_profiles"),
  domain: typeIdSchema("domains"),
  webhookSubscription: typeIdSchema("webhook_subscriptions"),
  communicationLog: typeIdSchema("communication_log"),
  notificationTemplate: typeIdSchema("notification_templates"),
  notificationDelivery: typeIdSchema("notification_deliveries"),
  personNote: typeIdSchema("person_notes"),
  organizationNote: typeIdSchema("organization_notes"),
  segment: typeIdSchema("segments"),
  segmentMember: typeIdSchema("segment_members"),
  supplier: typeIdSchema("suppliers"),
  supplierService: typeIdSchema("supplier_services"),
  supplierRate: typeIdSchema("supplier_rates"),
  supplierNote: typeIdSchema("supplier_notes"),
  supplierAvailability: typeIdSchema("supplier_availability"),
  supplierContract: typeIdSchema("supplier_contracts"),
  facility: typeIdSchema("facilities"),
  facilityContact: typeIdSchema("facility_contacts"),
  facilityFeature: typeIdSchema("facility_features"),
  facilityOperationSchedule: typeIdSchema("facility_operation_schedules"),
  property: typeIdSchema("properties"),
  propertyGroup: typeIdSchema("property_groups"),
  propertyGroupMember: typeIdSchema("property_group_members"),
  market: typeIdSchema("markets"),
  marketLocale: typeIdSchema("market_locales"),
  marketCurrency: typeIdSchema("market_currencies"),
  fxRateSet: typeIdSchema("fx_rate_sets"),
  exchangeRate: typeIdSchema("exchange_rates"),
  pricingCategory: typeIdSchema("pricing_categories"),
  pricingCategoryDependency: typeIdSchema("pricing_category_dependencies"),
  cancellationPolicy: typeIdSchema("cancellation_policies"),
  cancellationPolicyRule: typeIdSchema("cancellation_policy_rules"),
  priceCatalog: typeIdSchema("price_catalogs"),
  priceSchedule: typeIdSchema("price_schedules"),
  optionPriceRule: typeIdSchema("option_price_rules"),
  optionUnitPriceRule: typeIdSchema("option_unit_price_rules"),
  optionStartTimeRule: typeIdSchema("option_start_time_rules"),
  optionUnitTier: typeIdSchema("option_unit_tiers"),
  pickupPriceRule: typeIdSchema("pickup_price_rules"),
  dropoffPriceRule: typeIdSchema("dropoff_price_rules"),
  extraPriceRule: typeIdSchema("extra_price_rules"),
  productExtra: typeIdSchema("product_extras"),
  optionExtraConfig: typeIdSchema("option_extra_configs"),
  bookingExtra: typeIdSchema("booking_extras"),
  productContactRequirement: typeIdSchema("product_contact_requirements"),
  productBookingQuestion: typeIdSchema("product_booking_questions"),
  optionBookingQuestion: typeIdSchema("option_booking_questions"),
  bookingQuestionOption: typeIdSchema("booking_question_options"),
  bookingQuestionUnitTrigger: typeIdSchema("booking_question_unit_triggers"),
  bookingQuestionOptionTrigger: typeIdSchema("booking_question_option_triggers"),
  bookingQuestionExtraTrigger: typeIdSchema("booking_question_extra_triggers"),
  bookingAnswer: typeIdSchema("booking_answers"),
  offer: typeIdSchema("offers"),
  offerParticipant: typeIdSchema("offer_participants"),
  offerItem: typeIdSchema("offer_items"),
  offerItemParticipant: typeIdSchema("offer_item_participants"),
  order: typeIdSchema("orders"),
  orderParticipant: typeIdSchema("order_participants"),
  orderItem: typeIdSchema("order_items"),
  orderItemParticipant: typeIdSchema("order_item_participants"),
  orderTerm: typeIdSchema("order_terms"),
  marketPriceCatalog: typeIdSchema("market_price_catalogs"),
  marketProductRule: typeIdSchema("market_product_rules"),
  marketChannelRule: typeIdSchema("market_channel_rules"),
  product: typeIdSchema("products"),
  productOption: typeIdSchema("product_options"),
  optionUnit: typeIdSchema("option_units"),
  productActivationSetting: typeIdSchema("product_activation_settings"),
  productTicketSetting: typeIdSchema("product_ticket_settings"),
  productVisibilitySetting: typeIdSchema("product_visibility_settings"),
  productCapability: typeIdSchema("product_capabilities"),
  productDeliveryFormat: typeIdSchema("product_delivery_formats"),
  productTranslation: typeIdSchema("product_translations"),
  productOptionTranslation: typeIdSchema("product_option_translations"),
  optionUnitTranslation: typeIdSchema("option_unit_translations"),
  productDay: typeIdSchema("product_days"),
  productDayService: typeIdSchema("product_day_services"),
  productVersion: typeIdSchema("product_versions"),
  productNote: typeIdSchema("product_notes"),
  booking: typeIdSchema("bookings"),
  bookingParticipant: typeIdSchema("booking_participants"),
  bookingItem: typeIdSchema("booking_items"),
  bookingItemParticipant: typeIdSchema("booking_item_participants"),
  bookingPassenger: typeIdSchema("booking_participants"),
  bookingSupplierStatus: typeIdSchema("booking_supplier_statuses"),
  bookingActivity: typeIdSchema("booking_activity_log"),
  bookingNote: typeIdSchema("booking_notes"),
  bookingDocument: typeIdSchema("booking_documents"),
  availabilityRule: typeIdSchema("availability_rules"),
  availabilityStartTime: typeIdSchema("availability_start_times"),
  availabilitySlot: typeIdSchema("availability_slots"),
  availabilityCloseout: typeIdSchema("availability_closeouts"),
  availabilityPickupPoint: typeIdSchema("availability_pickup_points"),
  availabilitySlotPickup: typeIdSchema("availability_slot_pickups"),
  roomBlock: typeIdSchema("room_blocks"),
  roomUnitStatusEvent: typeIdSchema("room_unit_status_events"),
  maintenanceBlock: typeIdSchema("maintenance_blocks"),
  housekeepingTask: typeIdSchema("housekeeping_tasks"),
  stayOperation: typeIdSchema("stay_operations"),
  stayCheckpoint: typeIdSchema("stay_checkpoints"),
  stayServicePost: typeIdSchema("stay_service_posts"),
  stayFolio: typeIdSchema("stay_folios"),
  stayFolioLine: typeIdSchema("stay_folio_lines"),
  roomTypeRate: typeIdSchema("room_type_rates"),
  organization: typeIdSchema("organizations"),
  person: typeIdSchema("people"),
  pipeline: typeIdSchema("pipelines"),
  stage: typeIdSchema("stages"),
  opportunity: typeIdSchema("opportunities"),
  opportunityParticipant: typeIdSchema("opportunity_participants"),
  opportunityProduct: typeIdSchema("opportunity_products"),
  quote: typeIdSchema("quotes"),
  quoteLine: typeIdSchema("quote_lines"),
  activity: typeIdSchema("activities"),
  activityLink: typeIdSchema("activity_links"),
  activityParticipant: typeIdSchema("activity_participants"),
  customFieldDefinition: typeIdSchema("custom_field_definitions"),
  customFieldValue: typeIdSchema("custom_field_values"),
  invoice: typeIdSchema("invoices"),
  paymentInstrument: typeIdSchema("payment_instruments"),
  paymentSession: typeIdSchema("payment_sessions"),
  paymentAuthorization: typeIdSchema("payment_authorizations"),
  paymentCapture: typeIdSchema("payment_captures"),
  bookingPaymentSchedule: typeIdSchema("booking_payment_schedules"),
  bookingGuarantee: typeIdSchema("booking_guarantees"),
  bookingItemTaxLine: typeIdSchema("booking_item_tax_lines"),
  bookingItemCommission: typeIdSchema("booking_item_commissions"),
  invoiceLineItem: typeIdSchema("invoice_line_items"),
  payment: typeIdSchema("payments"),
  creditNote: typeIdSchema("credit_notes"),
  creditNoteLineItem: typeIdSchema("credit_note_line_items"),
  supplierPayment: typeIdSchema("supplier_payments"),
  financeNote: typeIdSchema("finance_notes"),
  resource: typeIdSchema("resources"),
  resourcePool: typeIdSchema("resource_pools"),
  resourcePoolMember: typeIdSchema("resource_pool_members"),
  resourceRequirement: typeIdSchema("resource_requirements"),
  resourceAllocation: typeIdSchema("resource_requirements"),
  resourceSlotAssignment: typeIdSchema("resource_slot_assignments"),
  resourceCloseout: typeIdSchema("resource_closeouts"),
  groundOperator: typeIdSchema("ground_operators"),
  groundVehicle: typeIdSchema("ground_vehicles"),
  groundDriver: typeIdSchema("ground_drivers"),
  groundTransferPreference: typeIdSchema("ground_transfer_preferences"),
  groundDispatch: typeIdSchema("ground_dispatches"),
  groundExecutionEvent: typeIdSchema("ground_execution_events"),
  groundDispatchAssignment: typeIdSchema("ground_dispatch_assignments"),
  groundDispatchLeg: typeIdSchema("ground_dispatch_legs"),
  groundDispatchPassenger: typeIdSchema("ground_dispatch_passengers"),
  groundDriverShift: typeIdSchema("ground_driver_shifts"),
  groundServiceIncident: typeIdSchema("ground_service_incidents"),
  groundDispatchCheckpoint: typeIdSchema("ground_dispatch_checkpoints"),
  channel: typeIdSchema("channels"),
  channelContract: typeIdSchema("channel_contracts"),
  channelCommissionRule: typeIdSchema("channel_commission_rules"),
  channelProductMapping: typeIdSchema("channel_product_mappings"),
  channelBookingLink: typeIdSchema("channel_booking_links"),
  channelWebhookEvent: typeIdSchema("channel_webhook_events"),
  channelSettlementRun: typeIdSchema("channel_settlement_runs"),
  channelSettlementItem: typeIdSchema("channel_settlement_items"),
  channelReconciliationRun: typeIdSchema("channel_reconciliation_runs"),
  channelReconciliationItem: typeIdSchema("channel_reconciliation_items"),
  channelInventoryReleaseExecution: typeIdSchema("channel_inventory_release_executions"),
  channelSettlementPolicy: typeIdSchema("channel_settlement_policies"),
  channelReconciliationPolicy: typeIdSchema("channel_reconciliation_policies"),
  channelReleaseSchedule: typeIdSchema("channel_release_schedules"),
  channelRemittanceException: typeIdSchema("channel_remittance_exceptions"),
  channelSettlementApproval: typeIdSchema("channel_settlement_approvals"),
  sellabilitySnapshot: typeIdSchema("sellability_snapshots"),
  sellabilitySnapshotItem: typeIdSchema("sellability_snapshot_items"),
  sellabilityPolicy: typeIdSchema("sellability_policies"),
  sellabilityPolicyResult: typeIdSchema("sellability_policy_results"),
  offerRefreshRun: typeIdSchema("offer_refresh_runs"),
  offerExpirationEvent: typeIdSchema("offer_expiration_events"),
  sellabilityExplanation: typeIdSchema("sellability_explanations"),
  productMedia: typeIdSchema("product_media"),
  productFeature: typeIdSchema("product_features"),
  productFaq: typeIdSchema("product_faqs"),
  productLocation: typeIdSchema("product_locations"),
  productType: typeIdSchema("product_types"),
  productCategory: typeIdSchema("product_categories"),
  productTag: typeIdSchema("product_tags"),
  contract: typeIdSchema("contracts"),
  contractTemplate: typeIdSchema("contract_templates"),
  contractTemplateVersion: typeIdSchema("contract_template_versions"),
  contractSignature: typeIdSchema("contract_signatures"),
  contractNumberSeries: typeIdSchema("contract_number_series"),
  contractAttachment: typeIdSchema("contract_attachments"),
  policy: typeIdSchema("policies"),
  policyVersion: typeIdSchema("policy_versions"),
  policyRule: typeIdSchema("policy_rules"),
  policyAssignment: typeIdSchema("policy_assignments"),
  policyAcceptance: typeIdSchema("policy_acceptances"),
  invoiceNumberSeries: typeIdSchema("invoice_number_series"),
  invoiceTemplate: typeIdSchema("invoice_templates"),
  invoiceRendition: typeIdSchema("invoice_renditions"),
  taxRegime: typeIdSchema("tax_regimes"),
  invoiceExternalRef: typeIdSchema("invoice_external_refs"),
} as const
