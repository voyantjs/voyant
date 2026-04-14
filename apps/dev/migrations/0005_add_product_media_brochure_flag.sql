ALTER TABLE "product_media"
ADD COLUMN IF NOT EXISTS "is_brochure" boolean DEFAULT false NOT NULL;
