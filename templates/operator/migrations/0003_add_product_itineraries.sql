CREATE TABLE IF NOT EXISTS "product_itineraries" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL,
  "name" text NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "product_itineraries_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_product_itineraries_product"
  ON "product_itineraries" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_itineraries_product_sort"
  ON "product_itineraries" ("product_id", "sort_order", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_itineraries_product_default"
  ON "product_itineraries" ("product_id", "is_default");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_product_itineraries_default"
  ON "product_itineraries" ("product_id")
  WHERE "is_default" = true;--> statement-breakpoint

ALTER TABLE "product_days" ADD COLUMN IF NOT EXISTS "itinerary_id" text;--> statement-breakpoint

INSERT INTO "product_itineraries" (
  "id",
  "product_id",
  "name",
  "is_default",
  "sort_order",
  "created_at",
  "updated_at"
)
SELECT
  concat('piti_', substring(md5("products"."id" || ':main-itinerary') from 1 for 26)),
  "products"."id",
  'Main itinerary',
  true,
  0,
  now(),
  now()
FROM "products"
WHERE NOT EXISTS (
  SELECT 1
  FROM "product_itineraries"
  WHERE "product_itineraries"."product_id" = "products"."id"
);--> statement-breakpoint

UPDATE "product_days"
SET "itinerary_id" = concat(
  'piti_',
  substring(md5("product_days"."product_id" || ':main-itinerary') from 1 for 26)
)
WHERE "itinerary_id" IS NULL;--> statement-breakpoint

ALTER TABLE "product_days" ALTER COLUMN "itinerary_id" SET NOT NULL;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_days_itinerary_id_product_itineraries_id_fk'
  ) THEN
    ALTER TABLE "product_days"
      ADD CONSTRAINT "product_days_itinerary_id_product_itineraries_id_fk"
      FOREIGN KEY ("itinerary_id") REFERENCES "product_itineraries"("id") ON DELETE cascade;
  END IF;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_product_days_itinerary"
  ON "product_days" ("itinerary_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_days_itinerary_day_number"
  ON "product_days" ("itinerary_id", "day_number");--> statement-breakpoint

ALTER TABLE "availability_slots" ADD COLUMN IF NOT EXISTS "itinerary_id" text;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'availability_slots_itinerary_id_product_itineraries_id_fk'
  ) THEN
    ALTER TABLE "availability_slots"
      ADD CONSTRAINT "availability_slots_itinerary_id_product_itineraries_id_fk"
      FOREIGN KEY ("itinerary_id") REFERENCES "product_itineraries"("id") ON DELETE set null;
  END IF;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_availability_slots_itinerary_starts_at"
  ON "availability_slots" ("itinerary_id", "starts_at");--> statement-breakpoint

ALTER TABLE "product_days" DROP CONSTRAINT IF EXISTS "product_days_product_id_products_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_product_days_product";--> statement-breakpoint
ALTER TABLE "product_days" DROP COLUMN IF EXISTS "product_id";
