ALTER TABLE "offers"
  ADD COLUMN IF NOT EXISTS "contact_first_name" text,
  ADD COLUMN IF NOT EXISTS "contact_last_name" text,
  ADD COLUMN IF NOT EXISTS "contact_email" text,
  ADD COLUMN IF NOT EXISTS "contact_phone" text,
  ADD COLUMN IF NOT EXISTS "contact_preferred_language" text,
  ADD COLUMN IF NOT EXISTS "contact_country" text,
  ADD COLUMN IF NOT EXISTS "contact_region" text,
  ADD COLUMN IF NOT EXISTS "contact_city" text,
  ADD COLUMN IF NOT EXISTS "contact_address_line1" text,
  ADD COLUMN IF NOT EXISTS "contact_postal_code" text;--> statement-breakpoint

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "contact_first_name" text,
  ADD COLUMN IF NOT EXISTS "contact_last_name" text,
  ADD COLUMN IF NOT EXISTS "contact_email" text,
  ADD COLUMN IF NOT EXISTS "contact_phone" text,
  ADD COLUMN IF NOT EXISTS "contact_preferred_language" text,
  ADD COLUMN IF NOT EXISTS "contact_country" text,
  ADD COLUMN IF NOT EXISTS "contact_region" text,
  ADD COLUMN IF NOT EXISTS "contact_city" text,
  ADD COLUMN IF NOT EXISTS "contact_address_line1" text,
  ADD COLUMN IF NOT EXISTS "contact_postal_code" text;--> statement-breakpoint

WITH offer_contact_candidates AS (
  SELECT DISTINCT ON (op.offer_id)
    op.offer_id,
    op.first_name,
    op.last_name,
    op.email,
    op.phone,
    op.preferred_language
  FROM "offer_participants" op
  WHERE op.participant_type IN ('booker', 'contact')
  ORDER BY
    op.offer_id,
    CASE
      WHEN op.participant_type = 'booker' AND op.is_primary THEN 0
      WHEN op.participant_type = 'contact' AND op.is_primary THEN 1
      WHEN op.participant_type = 'booker' THEN 2
      ELSE 3
    END,
    op.created_at
)
UPDATE "offers" o
SET
  "contact_first_name" = COALESCE(o."contact_first_name", occ.first_name),
  "contact_last_name" = COALESCE(o."contact_last_name", occ.last_name),
  "contact_email" = COALESCE(o."contact_email", occ.email),
  "contact_phone" = COALESCE(o."contact_phone", occ.phone),
  "contact_preferred_language" = COALESCE(o."contact_preferred_language", occ.preferred_language)
FROM offer_contact_candidates occ
WHERE o."id" = occ."offer_id";--> statement-breakpoint

WITH order_contact_candidates AS (
  SELECT DISTINCT ON (op.order_id)
    op.order_id,
    op.first_name,
    op.last_name,
    op.email,
    op.phone,
    op.preferred_language
  FROM "order_participants" op
  WHERE op.participant_type IN ('booker', 'contact')
  ORDER BY
    op.order_id,
    CASE
      WHEN op.participant_type = 'booker' AND op.is_primary THEN 0
      WHEN op.participant_type = 'contact' AND op.is_primary THEN 1
      WHEN op.participant_type = 'booker' THEN 2
      ELSE 3
    END,
    op.created_at
)
UPDATE "orders" o
SET
  "contact_first_name" = COALESCE(o."contact_first_name", occ.first_name),
  "contact_last_name" = COALESCE(o."contact_last_name", occ.last_name),
  "contact_email" = COALESCE(o."contact_email", occ.email),
  "contact_phone" = COALESCE(o."contact_phone", occ.phone),
  "contact_preferred_language" = COALESCE(o."contact_preferred_language", occ.preferred_language)
FROM order_contact_candidates occ
WHERE o."id" = occ."order_id";--> statement-breakpoint
