DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'offer_item_participants'
      AND column_name = 'participant_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'offer_item_participants'
      AND column_name = 'traveler_id'
  ) THEN
    ALTER TABLE "offer_item_participants" RENAME COLUMN "participant_id" TO "traveler_id";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'order_item_participants'
      AND column_name = 'participant_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'order_item_participants'
      AND column_name = 'traveler_id'
  ) THEN
    ALTER TABLE "order_item_participants" RENAME COLUMN "participant_id" TO "traveler_id";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transaction_pii_access_log'
      AND column_name = 'participant_kind'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transaction_pii_access_log'
      AND column_name = 'traveler_kind'
  ) THEN
    ALTER TABLE "transaction_pii_access_log" RENAME COLUMN "participant_kind" TO "traveler_kind";
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transaction_pii_access_log'
      AND column_name = 'participant_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transaction_pii_access_log'
      AND column_name = 'traveler_id'
  ) THEN
    ALTER TABLE "transaction_pii_access_log" RENAME COLUMN "participant_id" TO "traveler_id";
  END IF;
END $$;
