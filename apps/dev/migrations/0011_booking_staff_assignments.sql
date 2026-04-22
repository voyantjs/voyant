DO $$
BEGIN
  CREATE TYPE "public"."booking_staff_assignment_role" AS ENUM ('service_assignee', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "booking_staff_assignments" (
  "id" text PRIMARY KEY NOT NULL,
  "booking_id" text NOT NULL,
  "booking_item_id" text,
  "person_id" text,
  "role" "public"."booking_staff_assignment_role" DEFAULT 'service_assignee' NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text,
  "phone" text,
  "preferred_language" text,
  "is_primary" boolean DEFAULT false NOT NULL,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "booking_staff_assignments_booking_id_bookings_id_fk"
    FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "booking_staff_assignments_booking_item_id_booking_items_id_fk"
    FOREIGN KEY ("booking_item_id") REFERENCES "public"."booking_items"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_booking_staff_assignments_booking"
  ON "booking_staff_assignments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_booking_staff_assignments_booking_role_created"
  ON "booking_staff_assignments" USING btree ("booking_id", "role", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_booking_staff_assignments_item"
  ON "booking_staff_assignments" USING btree ("booking_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_booking_staff_assignments_person"
  ON "booking_staff_assignments" USING btree ("person_id");--> statement-breakpoint

WITH linked_staff AS (
  SELECT
    bp.id AS participant_id,
    bp.booking_id,
    bip.booking_item_id,
    bp.person_id,
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
  'service_assignee'::"public"."booking_staff_assignment_role",
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
