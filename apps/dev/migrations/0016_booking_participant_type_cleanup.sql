WITH ranked_legacy_contacts AS (
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
          ELSE 2
        END,
        CASE WHEN bp.is_primary THEN 0 ELSE 1 END,
        bp.created_at
    ) AS rank
  FROM "booking_participants" bp
  WHERE bp.participant_type IN ('booker', 'contact')
)
UPDATE "bookings" b
SET
  "contact_first_name" = COALESCE(b."contact_first_name", lc.first_name),
  "contact_last_name" = COALESCE(b."contact_last_name", lc.last_name),
  "contact_email" = COALESCE(b."contact_email", lc.email),
  "contact_phone" = COALESCE(b."contact_phone", lc.phone),
  "contact_preferred_language" = COALESCE(b."contact_preferred_language", lc.preferred_language)
FROM ranked_legacy_contacts lc
WHERE b.id = lc.booking_id AND lc.rank = 1;--> statement-breakpoint

WITH linked_staff AS (
  SELECT
    bp.id AS participant_id,
    bp.booking_id,
    bip.booking_item_id,
    bp.person_id,
    CASE WHEN bip.role = 'service_assignee' THEN 'service_assignee' ELSE 'other' END AS role,
    bp.first_name,
    bp.last_name,
    bp.email,
    bp.phone,
    bp.preferred_language,
    (bp.is_primary OR bip.is_primary) AS is_primary,
    bp.notes,
    jsonb_build_object(
      'legacyParticipantId', bp.id,
      'legacyParticipantType', bp.participant_type,
      'legacyItemLinkId', bip.id,
      'legacyItemRole', bip.role
    ) AS metadata
  FROM "booking_participants" bp
  INNER JOIN "booking_item_participants" bip ON bip.participant_id = bp.id
  WHERE bp.participant_type = 'staff'
),
unlinked_staff AS (
  SELECT
    bp.id AS participant_id,
    bp.booking_id,
    NULL::text AS booking_item_id,
    bp.person_id,
    'service_assignee' AS role,
    bp.first_name,
    bp.last_name,
    bp.email,
    bp.phone,
    bp.preferred_language,
    bp.is_primary,
    bp.notes,
    jsonb_build_object(
      'legacyParticipantId', bp.id,
      'legacyParticipantType', bp.participant_type
    ) AS metadata
  FROM "booking_participants" bp
  WHERE bp.participant_type = 'staff'
    AND NOT EXISTS (
      SELECT 1
      FROM "booking_item_participants" bip
      WHERE bip.participant_id = bp.id
    )
),
staff_rows AS (
  SELECT * FROM linked_staff
  UNION ALL
  SELECT * FROM unlinked_staff
)
INSERT INTO "booking_staff_assignments" (
  "id",
  "booking_id",
  "booking_item_id",
  "person_id",
  "role",
  "first_name",
  "last_name",
  "email",
  "phone",
  "preferred_language",
  "is_primary",
  "notes",
  "metadata"
)
SELECT
  'bkstf_' || substr(md5(random()::text || clock_timestamp()::text || participant_id), 1, 24),
  booking_id,
  booking_item_id,
  person_id,
  role::"public"."booking_staff_assignment_role",
  first_name,
  last_name,
  email,
  phone,
  preferred_language,
  is_primary,
  notes,
  metadata
FROM staff_rows
WHERE NOT EXISTS (
  SELECT 1
  FROM "booking_staff_assignments" existing
  WHERE
    coalesce(existing.booking_item_id, '') = coalesce(staff_rows.booking_item_id, '')
    AND (existing.metadata ->> 'legacyParticipantId') = staff_rows.participant_id
);--> statement-breakpoint

DELETE FROM "booking_participants"
WHERE "participant_type" IN ('booker', 'contact', 'staff');--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'booking_participant_type_legacy'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'booking_participant_type'
      AND e.enumlabel IN ('booker', 'contact', 'staff')
  ) THEN
    IF EXISTS (
      SELECT 1 FROM "booking_participants" WHERE "participant_type"::text IN ('booker', 'contact', 'staff')
    ) THEN
      RAISE EXCEPTION
        'booking_participant_type cleanup blocked: booker/contact/staff rows still exist in booking_participants';
    END IF;

    ALTER TYPE "public"."booking_participant_type" RENAME TO "booking_participant_type_legacy";
    CREATE TYPE "public"."booking_participant_type" AS ENUM ('traveler', 'occupant', 'other');

    ALTER TABLE "booking_participants"
      ALTER COLUMN "participant_type" DROP DEFAULT;
    ALTER TABLE "booking_participants"
      ALTER COLUMN "participant_type"
      TYPE "public"."booking_participant_type"
      USING ("participant_type"::text::"public"."booking_participant_type");
    ALTER TABLE "booking_participants"
      ALTER COLUMN "participant_type" SET DEFAULT 'traveler';

    DROP TYPE "public"."booking_participant_type_legacy";
  END IF;
END $$;--> statement-breakpoint
