CREATE TYPE "public"."product_feature_type" AS ENUM('inclusion', 'exclusion', 'highlight', 'important_information', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_location_type" AS ENUM('start', 'end', 'meeting_point', 'pickup', 'dropoff', 'point_of_interest', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_media_type" AS ENUM('image', 'video', 'document');--> statement-breakpoint
CREATE TYPE "public"."booking_allocation_status" AS ENUM('held', 'confirmed', 'released', 'expired', 'cancelled', 'fulfilled');--> statement-breakpoint
CREATE TYPE "public"."booking_allocation_type" AS ENUM('unit', 'pickup', 'resource');--> statement-breakpoint
CREATE TYPE "public"."booking_fulfillment_delivery_channel" AS ENUM('download', 'email', 'api', 'wallet', 'other');--> statement-breakpoint
CREATE TYPE "public"."booking_fulfillment_status" AS ENUM('pending', 'issued', 'reissued', 'revoked', 'failed');--> statement-breakpoint
CREATE TYPE "public"."booking_fulfillment_type" AS ENUM('voucher', 'ticket', 'pdf', 'qr_code', 'barcode', 'mobile', 'other');--> statement-breakpoint
CREATE TYPE "public"."booking_redemption_method" AS ENUM('manual', 'scan', 'api', 'other');--> statement-breakpoint
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
ALTER TABLE "price_catalogs" ALTER COLUMN "currency_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type_id" text;--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "product_id" text;--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "option_id" text;--> statement-breakpoint
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
CREATE INDEX "idx_products_product_type" ON "products" USING btree ("product_type_id");--> statement-breakpoint
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
