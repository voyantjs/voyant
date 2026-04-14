ALTER TABLE "product_media"
ADD COLUMN IF NOT EXISTS "is_brochure_current" boolean DEFAULT false NOT NULL;

ALTER TABLE "product_media"
ADD COLUMN IF NOT EXISTS "brochure_version" integer;

UPDATE "product_media"
SET "is_brochure_current" = true,
    "brochure_version" = COALESCE("brochure_version", 1)
WHERE "is_brochure" = true;
