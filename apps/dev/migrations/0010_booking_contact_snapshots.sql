ALTER TABLE "bookings"
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

WITH ranked_contacts AS (
  SELECT
    bp.booking_id,
    bp.first_name,
    bp.last_name,
    bp.email,
    bp.phone,
    bp.preferred_language,
    ROW_NUMBER() OVER (
      PARTITION BY bp.booking_id
      ORDER BY
        CASE bp.participant_type
          WHEN 'booker' THEN 0
          WHEN 'contact' THEN 1
          WHEN 'traveler' THEN 2
          WHEN 'occupant' THEN 3
          ELSE 4
        END,
        CASE WHEN bp.is_primary THEN 0 ELSE 1 END,
        bp.created_at
    ) AS rank
  FROM "booking_participants" bp
  WHERE
    bp.participant_type <> 'staff'
    AND (
      bp.first_name IS NOT NULL
      OR bp.last_name IS NOT NULL
      OR bp.email IS NOT NULL
      OR bp.phone IS NOT NULL
      OR bp.preferred_language IS NOT NULL
    )
)
UPDATE "bookings" b
SET
  "contact_first_name" = rc.first_name,
  "contact_last_name" = rc.last_name,
  "contact_email" = rc.email,
  "contact_phone" = rc.phone,
  "contact_preferred_language" = rc.preferred_language
FROM ranked_contacts rc
WHERE b.id = rc.booking_id AND rc.rank = 1;
