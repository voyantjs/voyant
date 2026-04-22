UPDATE "booking_item_participants"
SET "role" = 'other'
WHERE "role" IN ('primary_contact', 'service_assignee');--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'booking_item_participant_role_legacy'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'booking_item_participant_role'
      AND e.enumlabel IN ('primary_contact', 'service_assignee')
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM "booking_item_participants"
      WHERE "role"::text IN ('primary_contact', 'service_assignee')
    ) THEN
      RAISE EXCEPTION
        'booking_item_participant_role cleanup blocked: legacy primary_contact/service_assignee rows still exist in booking_item_participants';
    END IF;

    ALTER TYPE "public"."booking_item_participant_role" RENAME TO "booking_item_participant_role_legacy";
    CREATE TYPE "public"."booking_item_participant_role" AS ENUM ('traveler', 'occupant', 'beneficiary', 'other');

    ALTER TABLE "booking_item_participants"
      ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "booking_item_participants"
      ALTER COLUMN "role"
      TYPE "public"."booking_item_participant_role"
      USING ("role"::text::"public"."booking_item_participant_role");
    ALTER TABLE "booking_item_participants"
      ALTER COLUMN "role" SET DEFAULT 'traveler';

    DROP TYPE "public"."booking_item_participant_role_legacy";
  END IF;
END $$;--> statement-breakpoint
