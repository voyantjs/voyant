CREATE TABLE IF NOT EXISTS "destinations" (
  "id" text PRIMARY KEY NOT NULL,
  "parent_id" text,
  "slug" text NOT NULL,
  "code" text,
  "destination_type" text DEFAULT 'destination' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "destinations_parent_id_destinations_id_fk"
    FOREIGN KEY ("parent_id") REFERENCES "destinations"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uidx_destinations_slug" ON "destinations" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_destinations_code" ON "destinations" ("code");
CREATE INDEX IF NOT EXISTS "idx_destinations_parent" ON "destinations" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_destinations_active" ON "destinations" ("active");

CREATE TABLE IF NOT EXISTS "destination_translations" (
  "id" text PRIMARY KEY NOT NULL,
  "destination_id" text NOT NULL,
  "language_tag" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "seo_title" text,
  "seo_description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "destination_translations_destination_id_destinations_id_fk"
    FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "uidx_destination_translations_locale"
  ON "destination_translations" ("destination_id", "language_tag");
CREATE INDEX IF NOT EXISTS "idx_destination_translations_language"
  ON "destination_translations" ("language_tag");

CREATE TABLE IF NOT EXISTS "product_destinations" (
  "product_id" text NOT NULL,
  "destination_id" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "product_destinations_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
  CONSTRAINT "product_destinations_destination_id_destinations_id_fk"
    FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE,
  CONSTRAINT "product_destinations_pk" PRIMARY KEY ("product_id", "destination_id")
);

CREATE INDEX IF NOT EXISTS "idx_product_destinations_destination"
  ON "product_destinations" ("destination_id");
