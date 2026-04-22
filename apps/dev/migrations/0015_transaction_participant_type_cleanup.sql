DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'transaction_participant_type_legacy'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'transaction_participant_type'
      AND e.enumlabel IN ('booker', 'contact')
  ) THEN
    IF EXISTS (
      SELECT 1 FROM "offer_participants" WHERE "participant_type"::text IN ('booker', 'contact')
      UNION ALL
      SELECT 1 FROM "order_participants" WHERE "participant_type"::text IN ('booker', 'contact')
    ) THEN
      RAISE EXCEPTION
        'transaction_participant_type cleanup blocked: booker/contact rows still exist in offer_participants or order_participants';
    END IF;

    ALTER TYPE "public"."transaction_participant_type" RENAME TO "transaction_participant_type_legacy";
    CREATE TYPE "public"."transaction_participant_type" AS ENUM ('traveler', 'occupant', 'staff', 'other');

    ALTER TABLE "offer_participants"
      ALTER COLUMN "participant_type" DROP DEFAULT;
    ALTER TABLE "offer_participants"
      ALTER COLUMN "participant_type"
      TYPE "public"."transaction_participant_type"
      USING ("participant_type"::text::"public"."transaction_participant_type");
    ALTER TABLE "offer_participants"
      ALTER COLUMN "participant_type" SET DEFAULT 'traveler';

    ALTER TABLE "order_participants"
      ALTER COLUMN "participant_type" DROP DEFAULT;
    ALTER TABLE "order_participants"
      ALTER COLUMN "participant_type"
      TYPE "public"."transaction_participant_type"
      USING ("participant_type"::text::"public"."transaction_participant_type");
    ALTER TABLE "order_participants"
      ALTER COLUMN "participant_type" SET DEFAULT 'traveler';

    DROP TYPE "public"."transaction_participant_type_legacy";
  END IF;
END $$;--> statement-breakpoint
