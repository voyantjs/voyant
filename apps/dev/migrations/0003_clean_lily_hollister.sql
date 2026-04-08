CREATE TYPE "public"."product_feature_type" AS ENUM('inclusion', 'exclusion', 'highlight', 'important_information', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_location_type" AS ENUM('start', 'end', 'meeting_point', 'pickup', 'dropoff', 'point_of_interest', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_media_type" AS ENUM('image', 'video', 'document');--> statement-breakpoint
CREATE TYPE "public"."booking_allocation_status" AS ENUM('held', 'confirmed', 'released', 'expired', 'cancelled', 'fulfilled');--> statement-breakpoint
CREATE TYPE "public"."booking_allocation_type" AS ENUM('unit', 'pickup', 'resource');--> statement-breakpoint
CREATE TYPE "public"."booking_fulfillment_delivery_channel" AS ENUM('download', 'email', 'api', 'wallet', 'other');--> statement-breakpoint
CREATE TYPE "public"."booking_fulfillment_status" AS ENUM('pending', 'issued', 'reissued', 'revoked', 'failed');--> statement-breakpoint
CREATE TYPE "public"."booking_fulfillment_type" AS ENUM('voucher', 'ticket', 'pdf', 'qr_code', 'barcode', 'mobile', 'other');--> statement-breakpoint
CREATE TYPE "public"."booking_redemption_method" AS ENUM('manual', 'scan', 'api', 'other');--> statement-breakpoint
CREATE TYPE "public"."invoice_number_reset_strategy" AS ENUM('never', 'annual', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."invoice_number_series_scope" AS ENUM('invoice', 'proforma', 'credit_note');--> statement-breakpoint
CREATE TYPE "public"."invoice_rendition_format" AS ENUM('html', 'pdf', 'xml', 'json');--> statement-breakpoint
CREATE TYPE "public"."invoice_rendition_status" AS ENUM('pending', 'ready', 'failed', 'stale');--> statement-breakpoint
CREATE TYPE "public"."invoice_template_body_format" AS ENUM('html', 'markdown', 'lexical_json');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('invoice', 'proforma', 'credit_note');--> statement-breakpoint
CREATE TYPE "public"."tax_regime_code" AS ENUM('standard', 'reduced', 'exempt', 'reverse_charge', 'margin_scheme_art311', 'zero_rated', 'out_of_scope', 'other');--> statement-breakpoint
CREATE TABLE "room_type_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"rate_plan_id" text NOT NULL,
	"room_type_id" text NOT NULL,
	"price_schedule_id" text,
	"currency_code" char(3) NOT NULL,
	"base_amount_cents" integer,
	"extra_adult_amount_cents" integer,
	"extra_child_amount_cents" integer,
	"extra_infant_amount_cents" integer,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_category_products" (
	"product_id" text NOT NULL,
	"category_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_category_products_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_faqs" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_features" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"feature_type" "product_feature_type" DEFAULT 'highlight' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"location_type" "product_location_type" DEFAULT 'point_of_interest' NOT NULL,
	"title" text NOT NULL,
	"address" text,
	"city" text,
	"country_code" text,
	"latitude" double precision,
	"longitude" double precision,
	"google_place_id" text,
	"apple_place_id" text,
	"tripadvisor_location_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"day_id" text,
	"media_type" "product_media_type" NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"storage_key" text,
	"mime_type" text,
	"file_size" integer,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_tag_products" (
	"product_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_tag_products_product_id_tag_id_pk" PRIMARY KEY("product_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "product_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"booking_item_id" text NOT NULL,
	"product_id" text,
	"option_id" text,
	"option_unit_id" text,
	"pricing_category_id" text,
	"availability_slot_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"allocation_type" "booking_allocation_type" DEFAULT 'unit' NOT NULL,
	"status" "booking_allocation_status" DEFAULT 'held' NOT NULL,
	"hold_expires_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_fulfillments" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"booking_item_id" text,
	"participant_id" text,
	"fulfillment_type" "booking_fulfillment_type" NOT NULL,
	"delivery_channel" "booking_fulfillment_delivery_channel" NOT NULL,
	"status" "booking_fulfillment_status" DEFAULT 'pending' NOT NULL,
	"artifact_url" text,
	"payload" jsonb,
	"issued_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_redemption_events" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"booking_item_id" text,
	"participant_id" text,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"redeemed_by" text,
	"location" text,
	"method" "booking_redemption_method" DEFAULT 'manual' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_participant_travel_details" (
	"participant_id" text PRIMARY KEY NOT NULL,
	"identity_encrypted" jsonb,
	"dietary_encrypted" jsonb,
	"is_lead_traveler" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_item_product_details" (
	"booking_item_id" text PRIMARY KEY NOT NULL,
	"product_id" text,
	"option_id" text,
	"unit_id" text,
	"supplier_service_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_product_details" (
	"booking_id" text PRIMARY KEY NOT NULL,
	"product_id" text,
	"option_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_crm_details" (
	"booking_id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text,
	"quote_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_transaction_details" (
	"booking_id" text PRIMARY KEY NOT NULL,
	"offer_id" text,
	"order_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_distribution_details" (
	"booking_id" text PRIMARY KEY NOT NULL,
	"market_id" text,
	"source_channel_id" text,
	"fx_rate_set_id" text,
	"payment_owner" "booking_dist_payment_owner" DEFAULT 'operator' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_external_refs" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text,
	"external_number" text,
	"external_url" text,
	"status" text,
	"metadata" jsonb,
	"synced_at" timestamp with time zone,
	"sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_number_series" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"prefix" text DEFAULT '' NOT NULL,
	"separator" text DEFAULT '' NOT NULL,
	"pad_length" integer DEFAULT 4 NOT NULL,
	"current_sequence" integer DEFAULT 0 NOT NULL,
	"reset_strategy" "invoice_number_reset_strategy" DEFAULT 'never' NOT NULL,
	"reset_at" timestamp with time zone,
	"scope" "invoice_number_series_scope" DEFAULT 'invoice' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_number_series_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "invoice_renditions" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"template_id" text,
	"format" "invoice_rendition_format" DEFAULT 'pdf' NOT NULL,
	"status" "invoice_rendition_status" DEFAULT 'pending' NOT NULL,
	"storage_key" text,
	"file_size" integer,
	"checksum" text,
	"language" text,
	"error_message" text,
	"generated_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"jurisdiction" text,
	"body_format" "invoice_template_body_format" DEFAULT 'html' NOT NULL,
	"body" text NOT NULL,
	"css_styles" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tax_regimes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" "tax_regime_code" NOT NULL,
	"name" text NOT NULL,
	"jurisdiction" text,
	"rate_percent" integer,
	"description" text,
	"legal_reference" text,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "opportunity_products" DROP CONSTRAINT "opportunity_products_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunity_products" DROP CONSTRAINT "opportunity_products_supplier_service_id_supplier_services_id_fk";
--> statement-breakpoint
ALTER TABLE "quote_lines" DROP CONSTRAINT "quote_lines_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "quote_lines" DROP CONSTRAINT "quote_lines_supplier_service_id_supplier_services_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_closeouts" DROP CONSTRAINT "availability_closeouts_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_pickup_points" DROP CONSTRAINT "availability_pickup_points_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_pickup_points" DROP CONSTRAINT "availability_pickup_points_facility_id_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_rules" DROP CONSTRAINT "availability_rules_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_rules" DROP CONSTRAINT "availability_rules_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_rules" DROP CONSTRAINT "availability_rules_facility_id_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_slots" DROP CONSTRAINT "availability_slots_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_slots" DROP CONSTRAINT "availability_slots_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_slots" DROP CONSTRAINT "availability_slots_facility_id_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_start_times" DROP CONSTRAINT "availability_start_times_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_start_times" DROP CONSTRAINT "availability_start_times_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_start_times" DROP CONSTRAINT "availability_start_times_facility_id_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "pickup_locations" DROP CONSTRAINT "pickup_locations_facility_id_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "product_meeting_configs" DROP CONSTRAINT "product_meeting_configs_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_meeting_configs" DROP CONSTRAINT "product_meeting_configs_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "product_meeting_configs" DROP CONSTRAINT "product_meeting_configs_facility_id_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "rate_plan_room_types" DROP CONSTRAINT "rate_plan_room_types_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "rate_plan_room_types" DROP CONSTRAINT "rate_plan_room_types_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "rate_plan_room_types" DROP CONSTRAINT "rate_plan_room_types_unit_id_option_units_id_fk";
--> statement-breakpoint
ALTER TABLE "rate_plans" DROP CONSTRAINT "rate_plans_price_catalog_id_price_catalogs_id_fk";
--> statement-breakpoint
ALTER TABLE "rate_plans" DROP CONSTRAINT "rate_plans_cancellation_policy_id_cancellation_policies_id_fk";
--> statement-breakpoint
ALTER TABLE "rate_plans" DROP CONSTRAINT "rate_plans_market_id_markets_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_extras" DROP CONSTRAINT "booking_extras_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "option_extra_configs" DROP CONSTRAINT "option_extra_configs_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "product_extras" DROP CONSTRAINT "product_extras_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_answers" DROP CONSTRAINT "booking_answers_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_answers" DROP CONSTRAINT "booking_answers_booking_participant_id_booking_participants_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_answers" DROP CONSTRAINT "booking_answers_booking_extra_id_booking_extras_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_question_extra_triggers" DROP CONSTRAINT "booking_question_extra_triggers_product_extra_id_product_extras_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_question_extra_triggers" DROP CONSTRAINT "booking_question_extra_triggers_option_extra_config_id_option_extra_configs_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_question_option_triggers" DROP CONSTRAINT "booking_question_option_triggers_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_question_unit_triggers" DROP CONSTRAINT "booking_question_unit_triggers_unit_id_option_units_id_fk";
--> statement-breakpoint
ALTER TABLE "option_booking_questions" DROP CONSTRAINT "option_booking_questions_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "product_booking_questions" DROP CONSTRAINT "product_booking_questions_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_contact_requirements" DROP CONSTRAINT "product_contact_requirements_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_contact_requirements" DROP CONSTRAINT "product_contact_requirements_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "dropoff_price_rules" DROP CONSTRAINT "dropoff_price_rules_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "dropoff_price_rules" DROP CONSTRAINT "dropoff_price_rules_facility_id_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "extra_price_rules" DROP CONSTRAINT "extra_price_rules_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "extra_price_rules" DROP CONSTRAINT "extra_price_rules_product_extra_id_product_extras_id_fk";
--> statement-breakpoint
ALTER TABLE "extra_price_rules" DROP CONSTRAINT "extra_price_rules_option_extra_config_id_option_extra_configs_id_fk";
--> statement-breakpoint
ALTER TABLE "option_price_rules" DROP CONSTRAINT "option_price_rules_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "option_price_rules" DROP CONSTRAINT "option_price_rules_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "option_start_time_rules" DROP CONSTRAINT "option_start_time_rules_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "option_start_time_rules" DROP CONSTRAINT "option_start_time_rules_start_time_id_availability_start_times_id_fk";
--> statement-breakpoint
ALTER TABLE "option_unit_price_rules" DROP CONSTRAINT "option_unit_price_rules_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "option_unit_price_rules" DROP CONSTRAINT "option_unit_price_rules_unit_id_option_units_id_fk";
--> statement-breakpoint
ALTER TABLE "pickup_price_rules" DROP CONSTRAINT "pickup_price_rules_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "pickup_price_rules" DROP CONSTRAINT "pickup_price_rules_pickup_point_id_availability_pickup_points_id_fk";
--> statement-breakpoint
ALTER TABLE "pricing_categories" DROP CONSTRAINT "pricing_categories_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "pricing_categories" DROP CONSTRAINT "pricing_categories_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "pricing_categories" DROP CONSTRAINT "pricing_categories_unit_id_option_units_id_fk";
--> statement-breakpoint
ALTER TABLE "market_channel_rules" DROP CONSTRAINT "market_channel_rules_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "market_product_rules" DROP CONSTRAINT "market_product_rules_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "market_product_rules" DROP CONSTRAINT "market_product_rules_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "offer_items" DROP CONSTRAINT "offer_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "offer_items" DROP CONSTRAINT "offer_items_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "offer_items" DROP CONSTRAINT "offer_items_unit_id_option_units_id_fk";
--> statement-breakpoint
ALTER TABLE "offer_items" DROP CONSTRAINT "offer_items_slot_id_availability_slots_id_fk";
--> statement-breakpoint
ALTER TABLE "offer_participants" DROP CONSTRAINT "offer_participants_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_opportunity_id_opportunities_id_fk";
--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_quote_id_quotes_id_fk";
--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_market_id_markets_id_fk";
--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_source_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_fx_rate_set_id_fx_rate_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_unit_id_option_units_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_slot_id_availability_slots_id_fk";
--> statement-breakpoint
ALTER TABLE "order_participants" DROP CONSTRAINT "order_participants_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_opportunity_id_opportunities_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_quote_id_quotes_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_market_id_markets_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_source_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_fx_rate_set_id_fx_rate_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "offer_expiration_events" DROP CONSTRAINT "offer_expiration_events_offer_id_offers_id_fk";
--> statement-breakpoint
ALTER TABLE "offer_refresh_runs" DROP CONSTRAINT "offer_refresh_runs_offer_id_offers_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_policies" DROP CONSTRAINT "sellability_policies_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_policies" DROP CONSTRAINT "sellability_policies_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_policies" DROP CONSTRAINT "sellability_policies_market_id_markets_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_policies" DROP CONSTRAINT "sellability_policies_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshot_items" DROP CONSTRAINT "sellability_snapshot_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshot_items" DROP CONSTRAINT "sellability_snapshot_items_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshot_items" DROP CONSTRAINT "sellability_snapshot_items_slot_id_availability_slots_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshot_items" DROP CONSTRAINT "sellability_snapshot_items_unit_id_option_units_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshots" DROP CONSTRAINT "sellability_snapshots_offer_id_offers_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshots" DROP CONSTRAINT "sellability_snapshots_market_id_markets_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshots" DROP CONSTRAINT "sellability_snapshots_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshots" DROP CONSTRAINT "sellability_snapshots_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshots" DROP CONSTRAINT "sellability_snapshots_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshots" DROP CONSTRAINT "sellability_snapshots_slot_id_availability_slots_id_fk";
--> statement-breakpoint
ALTER TABLE "sellability_snapshots" DROP CONSTRAINT "sellability_snapshots_fx_rate_set_id_fx_rate_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_requirements" DROP CONSTRAINT "resource_requirements_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_requirements" DROP CONSTRAINT "resource_requirements_availability_rule_id_availability_rules_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_requirements" DROP CONSTRAINT "resource_requirements_start_time_id_availability_start_times_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_pools" DROP CONSTRAINT "resource_pools_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_slot_assignments" DROP CONSTRAINT "resource_slot_assignments_slot_id_availability_slots_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_slot_assignments" DROP CONSTRAINT "resource_slot_assignments_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_facility_id_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "ground_dispatch_passengers" DROP CONSTRAINT "ground_dispatch_passengers_participant_id_booking_participants_id_fk";
--> statement-breakpoint
ALTER TABLE "ground_dispatches" DROP CONSTRAINT "ground_dispatches_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "ground_dispatches" DROP CONSTRAINT "ground_dispatches_booking_item_id_booking_items_id_fk";
--> statement-breakpoint
ALTER TABLE "ground_drivers" DROP CONSTRAINT "ground_drivers_resource_id_resources_id_fk";
--> statement-breakpoint
ALTER TABLE "ground_operators" DROP CONSTRAINT "ground_operators_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "ground_transfer_preferences" DROP CONSTRAINT "ground_transfer_preferences_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "ground_transfer_preferences" DROP CONSTRAINT "ground_transfer_preferences_booking_item_id_booking_items_id_fk";
--> statement-breakpoint
ALTER TABLE "ground_vehicles" DROP CONSTRAINT "ground_vehicles_resource_id_resources_id_fk";
--> statement-breakpoint
ALTER TABLE "product_day_services" DROP CONSTRAINT "product_day_services_supplier_service_id_supplier_services_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_facility_id_facilities_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_items" DROP CONSTRAINT "booking_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_items" DROP CONSTRAINT "booking_items_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_items" DROP CONSTRAINT "booking_items_unit_id_option_units_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_items" DROP CONSTRAINT "booking_items_supplier_service_id_supplier_services_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_participants" DROP CONSTRAINT "booking_participants_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_supplier_statuses" DROP CONSTRAINT "booking_supplier_statuses_supplier_service_id_supplier_services_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_opportunity_id_opportunities_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_quote_id_quotes_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_offer_id_offers_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_slot_id_availability_slots_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_market_id_markets_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_source_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_fx_rate_set_id_fx_rate_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_guarantees" DROP CONSTRAINT "booking_guarantees_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_guarantees" DROP CONSTRAINT "booking_guarantees_booking_item_id_booking_items_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_item_commissions" DROP CONSTRAINT "booking_item_commissions_booking_item_id_booking_items_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_item_commissions" DROP CONSTRAINT "booking_item_commissions_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_item_tax_lines" DROP CONSTRAINT "booking_item_tax_lines_booking_item_id_booking_items_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_payment_schedules" DROP CONSTRAINT "booking_payment_schedules_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_payment_schedules" DROP CONSTRAINT "booking_payment_schedules_booking_item_id_booking_items_id_fk";
--> statement-breakpoint
ALTER TABLE "credit_notes" DROP CONSTRAINT "credit_notes_fx_rate_set_id_fx_rate_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "invoice_line_items" DROP CONSTRAINT "invoice_line_items_booking_item_id_booking_items_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_fx_rate_set_id_fx_rate_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_authorizations" DROP CONSTRAINT "payment_authorizations_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_authorizations" DROP CONSTRAINT "payment_authorizations_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_instruments" DROP CONSTRAINT "payment_instruments_person_id_people_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_instruments" DROP CONSTRAINT "payment_instruments_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_instruments" DROP CONSTRAINT "payment_instruments_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_instruments" DROP CONSTRAINT "payment_instruments_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_fx_rate_set_id_fx_rate_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "supplier_payments" DROP CONSTRAINT "supplier_payments_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "supplier_payments" DROP CONSTRAINT "supplier_payments_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "supplier_payments" DROP CONSTRAINT "supplier_payments_booking_supplier_status_id_booking_supplier_statuses_id_fk";
--> statement-breakpoint
ALTER TABLE "supplier_payments" DROP CONSTRAINT "supplier_payments_fx_rate_set_id_fx_rate_sets_id_fk";
--> statement-breakpoint
DROP INDEX "idx_booking_items_product";--> statement-breakpoint
DROP INDEX "idx_booking_items_option";--> statement-breakpoint
DROP INDEX "idx_booking_items_unit";--> statement-breakpoint
DROP INDEX "idx_bookings_opportunity";--> statement-breakpoint
DROP INDEX "idx_bookings_quote";--> statement-breakpoint
DROP INDEX "idx_bookings_offer";--> statement-breakpoint
DROP INDEX "idx_bookings_order";--> statement-breakpoint
DROP INDEX "idx_bookings_slot";--> statement-breakpoint
DROP INDEX "idx_bookings_market";--> statement-breakpoint
DROP INDEX "idx_bookings_source_channel";--> statement-breakpoint
DROP INDEX "idx_bookings_product";--> statement-breakpoint
DROP INDEX "idx_bookings_option";--> statement-breakpoint
DROP INDEX "idx_bookings_fx_rate_set";--> statement-breakpoint
ALTER TABLE "price_catalogs" ALTER COLUMN "currency_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_product_mappings" ALTER COLUMN "external_product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type_id" text;--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "option_unit_id" text;--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "pricing_category_id" text;--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "source_snapshot_id" text;--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "source_offer_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "hold_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "expired_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "redeemed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_type" "invoice_type" DEFAULT 'invoice' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "series_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sequence" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "template_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "tax_regime_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "room_type_rates" ADD CONSTRAINT "room_type_rates_rate_plan_id_rate_plans_id_fk" FOREIGN KEY ("rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_type_rates" ADD CONSTRAINT "room_type_rates_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category_products" ADD CONSTRAINT "product_category_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category_products" ADD CONSTRAINT "product_category_products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_faqs" ADD CONSTRAINT "product_faqs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_features" ADD CONSTRAINT "product_features_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_locations" ADD CONSTRAINT "product_locations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_day_id_product_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."product_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tag_products" ADD CONSTRAINT "product_tag_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tag_products" ADD CONSTRAINT "product_tag_products_tag_id_product_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."product_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_booking_item_id_booking_items_id_fk" FOREIGN KEY ("booking_item_id") REFERENCES "public"."booking_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_availability_slot_id_availability_slots_id_fk" FOREIGN KEY ("availability_slot_id") REFERENCES "public"."availability_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_fulfillments" ADD CONSTRAINT "booking_fulfillments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_fulfillments" ADD CONSTRAINT "booking_fulfillments_booking_item_id_booking_items_id_fk" FOREIGN KEY ("booking_item_id") REFERENCES "public"."booking_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_fulfillments" ADD CONSTRAINT "booking_fulfillments_participant_id_booking_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."booking_participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_redemption_events" ADD CONSTRAINT "booking_redemption_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_redemption_events" ADD CONSTRAINT "booking_redemption_events_booking_item_id_booking_items_id_fk" FOREIGN KEY ("booking_item_id") REFERENCES "public"."booking_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_redemption_events" ADD CONSTRAINT "booking_redemption_events_participant_id_booking_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."booking_participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_participant_travel_details" ADD CONSTRAINT "booking_participant_travel_details_participant_id_booking_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."booking_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_external_refs" ADD CONSTRAINT "invoice_external_refs_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_renditions" ADD CONSTRAINT "invoice_renditions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_renditions" ADD CONSTRAINT "invoice_renditions_template_id_invoice_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."invoice_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_room_type_rates_rate_plan" ON "room_type_rates" USING btree ("rate_plan_id");--> statement-breakpoint
CREATE INDEX "idx_room_type_rates_room_type" ON "room_type_rates" USING btree ("room_type_id");--> statement-breakpoint
CREATE INDEX "idx_room_type_rates_price_schedule" ON "room_type_rates" USING btree ("price_schedule_id");--> statement-breakpoint
CREATE INDEX "idx_room_type_rates_active" ON "room_type_rates" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_room_type_rates_plan_room_schedule" ON "room_type_rates" USING btree ("rate_plan_id","room_type_id","price_schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_product_categories_slug" ON "product_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_product_categories_parent" ON "product_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_product_categories_active" ON "product_categories" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_pcp_category" ON "product_category_products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_product_faqs_product" ON "product_faqs" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_features_product" ON "product_features" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_features_type" ON "product_features" USING btree ("feature_type");--> statement-breakpoint
CREATE INDEX "idx_product_locations_product" ON "product_locations" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_locations_type" ON "product_locations" USING btree ("location_type");--> statement-breakpoint
CREATE INDEX "idx_product_media_product" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_media_day" ON "product_media" USING btree ("day_id");--> statement-breakpoint
CREATE INDEX "idx_product_media_product_day" ON "product_media" USING btree ("product_id","day_id");--> statement-breakpoint
CREATE INDEX "idx_ptp_tag" ON "product_tag_products" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_product_tags_name" ON "product_tags" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_product_types_code" ON "product_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_product_types_active" ON "product_types" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_booking_allocations_booking" ON "booking_allocations" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_booking_allocations_item" ON "booking_allocations" USING btree ("booking_item_id");--> statement-breakpoint
CREATE INDEX "idx_booking_allocations_slot" ON "booking_allocations" USING btree ("availability_slot_id");--> statement-breakpoint
CREATE INDEX "idx_booking_allocations_status" ON "booking_allocations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_booking_fulfillments_booking" ON "booking_fulfillments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_booking_fulfillments_item" ON "booking_fulfillments" USING btree ("booking_item_id");--> statement-breakpoint
CREATE INDEX "idx_booking_fulfillments_participant" ON "booking_fulfillments" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "idx_booking_fulfillments_status" ON "booking_fulfillments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_booking_redemption_events_booking" ON "booking_redemption_events" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_booking_redemption_events_item" ON "booking_redemption_events" USING btree ("booking_item_id");--> statement-breakpoint
CREATE INDEX "idx_booking_redemption_events_participant" ON "booking_redemption_events" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "idx_booking_redemption_events_redeemed_at" ON "booking_redemption_events" USING btree ("redeemed_at");--> statement-breakpoint
CREATE INDEX "idx_bptd_lead_traveler" ON "booking_participant_travel_details" USING btree ("is_lead_traveler");--> statement-breakpoint
CREATE INDEX "idx_bipd_product" ON "booking_item_product_details" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_bipd_option" ON "booking_item_product_details" USING btree ("option_id");--> statement-breakpoint
CREATE INDEX "idx_bipd_unit" ON "booking_item_product_details" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_bipd_supplier_service" ON "booking_item_product_details" USING btree ("supplier_service_id");--> statement-breakpoint
CREATE INDEX "idx_bpd_product" ON "booking_product_details" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_bpd_option" ON "booking_product_details" USING btree ("option_id");--> statement-breakpoint
CREATE INDEX "idx_bcd_opportunity" ON "booking_crm_details" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "idx_bcd_quote" ON "booking_crm_details" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "idx_btd_offer" ON "booking_transaction_details" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "idx_btd_order" ON "booking_transaction_details" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_bdd_market" ON "booking_distribution_details" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "idx_bdd_source_channel" ON "booking_distribution_details" USING btree ("source_channel_id");--> statement-breakpoint
CREATE INDEX "idx_bdd_fx_rate_set" ON "booking_distribution_details" USING btree ("fx_rate_set_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_external_refs_invoice" ON "invoice_external_refs" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_external_refs_provider" ON "invoice_external_refs" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_invoice_external_refs_invoice_provider" ON "invoice_external_refs" USING btree ("invoice_id","provider");--> statement-breakpoint
CREATE INDEX "idx_invoice_number_series_scope" ON "invoice_number_series" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "idx_invoice_number_series_active" ON "invoice_number_series" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_invoice_renditions_invoice" ON "invoice_renditions" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_renditions_template" ON "invoice_renditions" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_renditions_status" ON "invoice_renditions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoice_renditions_format" ON "invoice_renditions" USING btree ("format");--> statement-breakpoint
CREATE INDEX "idx_invoice_templates_language" ON "invoice_templates" USING btree ("language");--> statement-breakpoint
CREATE INDEX "idx_invoice_templates_jurisdiction" ON "invoice_templates" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_invoice_templates_default" ON "invoice_templates" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "idx_invoice_templates_active" ON "invoice_templates" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_tax_regimes_code" ON "tax_regimes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_tax_regimes_jurisdiction" ON "tax_regimes" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_tax_regimes_active" ON "tax_regimes" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_opportunity_products_product" ON "opportunity_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_opportunity_products_supplier_service" ON "opportunity_products" USING btree ("supplier_service_id");--> statement-breakpoint
CREATE INDEX "idx_quote_lines_product" ON "quote_lines" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_quote_lines_supplier_service" ON "quote_lines" USING btree ("supplier_service_id");--> statement-breakpoint
CREATE INDEX "idx_product_day_services_supplier_service" ON "product_day_services" USING btree ("supplier_service_id");--> statement-breakpoint
CREATE INDEX "idx_products_product_type" ON "products" USING btree ("product_type_id");--> statement-breakpoint
CREATE INDEX "idx_booking_supplier_statuses_service" ON "booking_supplier_statuses" USING btree ("supplier_service_id");--> statement-breakpoint
ALTER TABLE "booking_items" DROP COLUMN "unit_id";--> statement-breakpoint
ALTER TABLE "booking_items" DROP COLUMN "supplier_service_id";--> statement-breakpoint
ALTER TABLE "booking_participants" DROP COLUMN "date_of_birth";--> statement-breakpoint
ALTER TABLE "booking_participants" DROP COLUMN "nationality";--> statement-breakpoint
ALTER TABLE "booking_participants" DROP COLUMN "passport_number";--> statement-breakpoint
ALTER TABLE "booking_participants" DROP COLUMN "passport_expiry";--> statement-breakpoint
ALTER TABLE "booking_participants" DROP COLUMN "dietary_requirements";--> statement-breakpoint
ALTER TABLE "booking_participants" DROP COLUMN "is_lead_traveler";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "option_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "opportunity_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "quote_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "offer_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "order_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "slot_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "market_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "source_channel_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "payment_owner";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "fx_rate_set_id";--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."notification_template_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_status" AS ENUM('pending', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_target_type" AS ENUM('booking', 'booking_payment_schedule', 'booking_guarantee', 'invoice', 'payment_session', 'person', 'organization', 'other');--> statement-breakpoint
CREATE TYPE "public"."notification_reminder_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."notification_reminder_target_type" AS ENUM('booking_payment_schedule');--> statement-breakpoint
CREATE TYPE "public"."notification_reminder_run_status" AS ENUM('processing', 'sent', 'skipped', 'failed');--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"provider" text,
	"status" "notification_template_status" DEFAULT 'draft' NOT NULL,
	"subject_template" text,
	"html_template" text,
	"text_template" text,
	"from_address" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_templates_slug_unique" UNIQUE("slug")
);--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text,
	"template_slug" text,
	"target_type" "notification_target_type" DEFAULT 'other' NOT NULL,
	"target_id" text,
	"person_id" text,
	"organization_id" text,
	"booking_id" text,
	"invoice_id" text,
	"payment_session_id" text,
	"channel" "notification_channel" NOT NULL,
	"provider" text NOT NULL,
	"provider_message_id" text,
	"status" "notification_delivery_status" DEFAULT 'pending' NOT NULL,
	"to_address" text NOT NULL,
	"from_address" text,
	"subject" text,
	"html_body" text,
	"text_body" text,
	"payload_data" jsonb,
	"metadata" jsonb,
	"error_message" text,
	"scheduled_for" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "notification_reminder_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"status" "notification_reminder_status" DEFAULT 'draft' NOT NULL,
	"target_type" "notification_reminder_target_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"provider" text,
	"template_id" text,
	"template_slug" text,
	"relative_days_from_due_date" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_reminder_rules_slug_unique" UNIQUE("slug")
);--> statement-breakpoint
CREATE TABLE "notification_reminder_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"reminder_rule_id" text NOT NULL,
	"target_type" "notification_reminder_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"booking_id" text,
	"person_id" text,
	"organization_id" text,
	"payment_session_id" text,
	"notification_delivery_id" text,
	"status" "notification_reminder_run_status" NOT NULL,
	"recipient" text,
	"scheduled_for" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_reminder_runs_dedupe_key_unique" UNIQUE("dedupe_key")
);--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reminder_rules" ADD CONSTRAINT "notification_reminder_rules_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reminder_runs" ADD CONSTRAINT "notification_reminder_runs_reminder_rule_id_notification_reminder_rules_id_fk" FOREIGN KEY ("reminder_rule_id") REFERENCES "public"."notification_reminder_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reminder_runs" ADD CONSTRAINT "notification_reminder_runs_notification_delivery_id_notification_deliveries_id_fk" FOREIGN KEY ("notification_delivery_id") REFERENCES "public"."notification_deliveries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notification_templates_channel" ON "notification_templates" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "idx_notification_templates_provider" ON "notification_templates" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_notification_templates_status" ON "notification_templates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_notification_templates_slug" ON "notification_templates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_template" ON "notification_deliveries" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_target" ON "notification_deliveries" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_person" ON "notification_deliveries" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_org" ON "notification_deliveries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_booking" ON "notification_deliveries" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_invoice" ON "notification_deliveries" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_payment_session" ON "notification_deliveries" USING btree ("payment_session_id");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_channel" ON "notification_deliveries" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_provider" ON "notification_deliveries" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_status" ON "notification_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_scheduled_for" ON "notification_deliveries" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_notification_reminder_rules_status" ON "notification_reminder_rules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notification_reminder_rules_target" ON "notification_reminder_rules" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "idx_notification_reminder_rules_channel" ON "notification_reminder_rules" USING btree ("channel");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_notification_reminder_rules_slug" ON "notification_reminder_rules" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_notification_reminder_runs_rule" ON "notification_reminder_runs" USING btree ("reminder_rule_id");--> statement-breakpoint
CREATE INDEX "idx_notification_reminder_runs_target" ON "notification_reminder_runs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_notification_reminder_runs_booking" ON "notification_reminder_runs" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_notification_reminder_runs_status" ON "notification_reminder_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_notification_reminder_runs_dedupe" ON "notification_reminder_runs" USING btree ("dedupe_key");
